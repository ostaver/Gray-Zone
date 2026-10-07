import { Mesh, Program, RenderTarget, Texture, Triangle } from 'ogl';
import type { Frame, GLView, Stage } from '../stage';
import vertex from '../shaders/fullscreen.vert.glsl?raw';
import fieldFragment from '../shaders/seam-field.frag.glsl?raw';
import fragment from '../shaders/logo-orb.frag.glsl?raw';

export interface LogoOrbState {
  /** Disc rotation, radians, clockwise on screen. */
  angle: number;
  /** Pointer in CSS px relative to the view's top-left. */
  mouse: { x: number; y: number };
  /** 0..1, the disc develops from its centre. */
  reveal: number;
  /** Frozen time for reduced motion. */
  still: boolean;
}

export interface LogoOrbOptions {
  el: HTMLElement;
  /** Dot cell, CSS px. */
  cell: number;
  /** Disc radius as a fraction of half the view's shorter side. */
  radius: number;
  fps: number;
  /** Wordmark lines, split across the tear between their halves (СИ|ВА, ЗО|НА). */
  lines: string[];
  state: LogoOrbState;
}

/** Wordmark texture: the square around the disc, so disc space maps straight onto it. */
const LETTERS_PX = 1024;
const FONT = '"Oswald Variable"';

/**
 * Draws the wordmark the way the logo sets it: two stacked lines of heavy condensed caps,
 * each placed so the tear (the vertical centre) falls between its two halves.
 */
function drawLetters(canvas: HTMLCanvasElement, lines: string[]): void {
  const ctx = canvas.getContext('2d')!;
  const s = canvas.width;
  ctx.clearRect(0, 0, s, s);
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 100px ${FONT}`;
  // Size to the logo's proportions: the block spans about half the disc's width.
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const capH = ctx.measureText(lines.join('')).actualBoundingBoxAscent;
  const size = Math.min((s * 0.5) / widest, (s * 0.33) / (capH * lines.length * 1.12)) * 100;
  ctx.font = `700 ${size}px ${FONT}`;
  const cap = ctx.measureText(lines.join('')).actualBoundingBoxAscent;
  const gap = cap * 0.12;
  let baseline = s / 2 - (lines.length * cap + (lines.length - 1) * gap) / 2 + cap;
  for (const line of lines) {
    const chars = [...line];
    const left = chars.slice(0, Math.ceil(chars.length / 2)).join('');
    ctx.fillText(line, s / 2 - ctx.measureText(left).width, baseline);
    baseline += cap + gap;
  }
}

/** The logo disc in halftone dots, turning with scroll (About section). */
export function createLogoOrb(stage: Stage, opts: LogoOrbOptions): GLView {
  const { gl, renderer } = stage;
  const triangle = new Triangle(gl);

  // Pass 1: the hero's noise field, one texel per dot cell, centred on the disc.
  const field = new RenderTarget(gl, { width: 1, height: 1, depth: false, minFilter: gl.NEAREST, magFilter: gl.NEAREST });
  const fieldProgram = new Program(gl, {
    vertex,
    fragment: fieldFragment,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uSize: { value: [1, 1] },
      uCell: { value: opts.cell },
      uTime: { value: 0 },
    },
  });
  const fieldMesh = new Mesh(gl, { geometry: triangle, program: fieldProgram });

  // The wordmark stays blank (an empty texel) until its font is ready.
  const letters = new Texture(gl, { generateMipmaps: false, flipY: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR });
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = LETTERS_PX;
  // The text argument pulls in the Cyrillic subset; a bare family load only fetches Latin.
  void document.fonts.load(`700 100px ${FONT}`, opts.lines.join('')).then(() => {
    drawLetters(canvas, opts.lines);
    letters.image = canvas;
    letters.needsUpdate = true;
  });

  // Pass 2: dots, dark half, wordmark and torn edge, per pixel.
  const program = new Program(gl, {
    vertex,
    fragment,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uRes: { value: [1, 1] },
      uOffset: { value: [0, 0] },
      uDpr: { value: 1 },
      uField: { value: field.texture },
      uFieldHalf: { value: 0 },
      uCell: { value: opts.cell },
      uRadius: { value: 1 },
      uLetters: { value: letters },
      uAngle: { value: 0 },
      uMouse: { value: [-1e4, -1e4] },
      uReveal: { value: 0 },
    },
  });
  const mesh = new Mesh(gl, { geometry: triangle, program });
  const fu = fieldProgram.uniforms;
  const u = program.uniforms;
  let frozenTime = 0;

  return {
    el: opts.el,
    fps: opts.fps,
    render(frame: Frame) {
      const { state } = opts;
      if (!state.still) frozenTime = frame.time;
      const cssW = frame.width / frame.dpr;
      const cssH = frame.height / frame.dpr;
      const radius = (Math.min(cssW, cssH) / 2) * opts.radius;
      // Covers the disc at any rotation, plus a cell of margin each side.
      const cells = Math.ceil((radius * 2) / opts.cell) + 2;

      field.setSize(cells, cells);
      fu.uSize.value = [cells * opts.cell, cells * opts.cell];
      fu.uTime.value = frozenTime;
      renderer.bindFramebuffer(field);
      gl.disable(gl.SCISSOR_TEST);
      // Drive GL directly: OGL's setViewport ignores offset-only changes (see stage.ts).
      gl.viewport(0, 0, cells, cells);
      Object.assign(renderer.state.viewport, { x: 0, y: 0, width: cells, height: cells });
      fieldMesh.draw();
      frame.bindScreen();

      u.uRes.value = [frame.width, frame.height];
      u.uOffset.value = [frame.x, frame.y];
      u.uDpr.value = frame.dpr;
      u.uFieldHalf.value = Math.floor(cells / 2);
      u.uRadius.value = radius;
      u.uAngle.value = state.angle;
      u.uMouse.value = [state.mouse.x, state.mouse.y];
      u.uReveal.value = state.reveal;
      mesh.draw();
    },
    dispose() {
      program.remove();
      fieldProgram.remove();
      triangle.remove();
      gl.deleteFramebuffer(field.buffer);
      gl.deleteTexture(field.texture.texture);
      gl.deleteTexture(letters.texture);
    },
  };
}
