import { Mesh, Program, Renderer, RenderTarget, Triangle } from 'ogl';
import { coarsePointer } from '../motion/gsap';
import vertex from './shaders/fullscreen.vert.glsl?raw';
import fieldFragment from './shaders/chroma-field.frag.glsl?raw';
import dotsFragment from './shaders/chroma-dots.frag.glsl?raw';

/** Five stops, darkest → brightest: `[hex, alpha]`. */
export type Palette = readonly (readonly [hex: string, alpha: number])[];

export interface ChromaFieldOptions {
  /** Canvas the field renders into; shows the left palette. */
  left: HTMLCanvasElement;
  /** 2D canvas that receives a copy of the right-palette pass. */
  right: HTMLCanvasElement;
  palettes: { left: Palette; right: Palette };
  /** The two halves meet somewhere within [min, max] (fractions of the width). */
  split: readonly [number, number];
  /** Dot cell, CSS px. */
  cell: number;
}

// Chromatic theme hero settings, mapped from its UI scale to shader units.
const FREQUENCY = 1.19;
const SPEED = 0.15;
const GAMMA = 2.08;
const BIAS = -0.1;
const FPS = 30;

const toVec4 = ([hex, alpha]: Palette[number]) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, alpha];
};

/**
 * Viewport-sized "Chromatic Waves" dot field in its own short-lived WebGL2 context (the page
 * stage sits under the overlay). Split along a tear into two palettes: each frame renders the
 * right half and copies it into a 2D canvas, then renders the left half in place, so two
 * clipped panels can each carry a live half and move independently.
 */
export class ChromaField {
  /** 0 → 1: the field develops outward from the centre. */
  intro = 0;
  /** Radius kept quiet around the centre (the logo), CSS px. */
  pocket = 0;

  private readonly field: Program;
  private readonly dots: Program;
  private readonly fieldMesh: Mesh;
  private readonly dotsMesh: Mesh;
  private readonly target: RenderTarget;
  private readonly mirror: CanvasRenderingContext2D;
  private readonly palettes: { left: number[][]; right: number[][] };
  private last = -Infinity;

  static create(opts: ChromaFieldOptions): ChromaField | null {
    const mirror = opts.right.getContext('2d');
    if (!mirror) return null;
    let renderer: Renderer;
    try {
      const dpr = Math.min(window.devicePixelRatio || 1, coarsePointer.matches ? 1.5 : 2);
      renderer = new Renderer({ canvas: opts.left, dpr, alpha: true, premultipliedAlpha: true, antialias: false, depth: false, autoClear: false, powerPreference: 'high-performance' });
    } catch {
      return null;
    }
    if (!renderer.gl) return null;
    if (!renderer.isWebgl2) {
      renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
      return null;
    }
    return new ChromaField(renderer, mirror, opts);
  }

  private constructor(
    private readonly renderer: Renderer,
    mirror: CanvasRenderingContext2D,
    private readonly opts: ChromaFieldOptions,
  ) {
    const { gl } = renderer;
    this.mirror = mirror;
    this.palettes = { left: opts.palettes.left.map(toVec4), right: opts.palettes.right.map(toVec4) };
    this.target = new RenderTarget(gl, { width: 1, height: 1, minFilter: gl.NEAREST, depth: false });
    this.field = new Program(gl, {
      vertex,
      fragment: fieldFragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uRes: { value: [1, 1] },
        uOrigin: { value: [0, 0] },
        uCell: { value: 1 },
        uTime: { value: 0 },
        uFrequency: { value: FREQUENCY },
        uGamma: { value: GAMMA },
        uBias: { value: BIAS },
        uIntro: { value: 0 },
        uPocket: { value: 0 },
      },
    });
    this.dots = new Program(gl, {
      vertex,
      fragment: dotsFragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uField: { value: this.target.texture },
        uOrigin: { value: [0, 0] },
        uCell: { value: 1 },
        uPalette: { value: this.palettes.left },
      },
    });
    const geometry = new Triangle(gl);
    this.fieldMesh = new Mesh(gl, { geometry, program: this.field });
    this.dotsMesh = new Mesh(gl, { geometry, program: this.dots });
    gl.clearColor(0, 0, 0, 0);
    this.resize();
  }

  resize(): void {
    const { renderer, opts } = this;
    renderer.setSize(window.innerWidth, window.innerHeight);
    const { width, height } = renderer.gl.canvas;
    opts.right.width = width;
    opts.right.height = height;
    const cell = Math.round(opts.cell * renderer.dpr);
    const cols = Math.ceil(width / cell);
    const rows = Math.ceil(height / cell);
    this.target.setSize(cols, rows);
    const origin = [(width - cols * cell) / 2, (height - rows * cell) / 2];
    this.field.uniforms.uRes.value = [width, height];
    this.field.uniforms.uOrigin.value = origin;
    this.field.uniforms.uCell.value = cell;
    this.dots.uniforms.uOrigin.value = origin;
    this.dots.uniforms.uCell.value = cell;
    this.last = -Infinity;
  }

  /** Draws a frame when one is due (capped at 30 fps, like the original). */
  render(time: number): void {
    const { renderer, target, opts } = this;
    const { gl } = renderer;
    if (time - this.last < 1 / FPS - 0.002 || gl.isContextLost()) return;
    this.last = time;

    const f = this.field.uniforms;
    f.uTime.value = 10 + time * SPEED;
    f.uIntro.value = this.intro;
    f.uPocket.value = this.pocket * renderer.dpr;
    renderer.bindFramebuffer(target);
    renderer.setViewport(target.width, target.height);
    this.fieldMesh.draw();

    const { width, height } = gl.canvas;
    const margin = Math.ceil(this.dots.uniforms.uCell.value);
    const rx = Math.max(0, Math.floor(opts.split[0] * width) - margin);
    const lw = Math.min(width, Math.ceil(opts.split[1] * width) + margin);
    renderer.bindFramebuffer();
    renderer.setViewport(width, height);
    gl.enable(gl.SCISSOR_TEST);

    // Right half first: copy it out before the left pass paints over the shared band.
    this.pass(this.palettes.right, rx, width - rx);
    this.mirror.clearRect(rx, 0, width - rx, height);
    this.mirror.drawImage(gl.canvas, rx, 0, width - rx, height, rx, 0, width - rx, height);
    this.pass(this.palettes.left, 0, lw);

    gl.disable(gl.SCISSOR_TEST);
  }

  dispose(): void {
    this.renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  private pass(palette: number[][], x: number, w: number): void {
    const { gl } = this.renderer;
    gl.scissor(x, 0, w, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.dots.uniforms.uPalette.value = palette;
    this.dotsMesh.draw();
  }
}
