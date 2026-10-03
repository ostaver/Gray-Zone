import { Mesh, Program, RenderTarget, Triangle } from 'ogl';
import type { Frame, GLView, Stage } from '../stage';
import vertex from '../shaders/fullscreen.vert.glsl?raw';
import fieldFragment from '../shaders/seam-field.frag.glsl?raw';
import fragment from '../shaders/seam-halftone.frag.glsl?raw';

export interface SeamHalftoneState {
  seam: Float32Array;
  /** Pointer in CSS px relative to the view's top-left. */
  mouse: { x: number; y: number };
  mouseForce: number;
  reveal: number;
  progress: number;
  /** 0 = dark surface palette, 1 = light surface palette; both retain red accents. */
  whiteZone: number;
  /** Frozen time for reduced motion. */
  still: boolean;
}

export interface SeamHalftoneOptions {
  el: HTMLElement;
  /** Dot cell, CSS px. */
  cell: number;
  fps: number;
  state: SeamHalftoneState;
}

/** The hero's dot field (Chromatic Waves in the logo's colours), split by the torn seam. */
export function createSeamHalftone(stage: Stage, opts: SeamHalftoneOptions): GLView {
  const { gl, renderer } = stage;
  const seamValues: number[] = Array.from(opts.state.seam);
  const triangle = new Triangle(gl);

  // Pass 1: the noise field, one texel per dot cell. Sized for the smallest cell (top of the
  // hero); cells only grow from there, so later frames use a corner of it.
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

  // Pass 2: dots, seam and torn edge, per pixel.
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
      uCell: { value: opts.cell },
      // OGL only resolves `uSeam[0]` when the value is a real Array (not a typed array).
      uSeam: { value: seamValues },
      uMouse: { value: [-1e4, -1e4] },
      uMouseForce: { value: 0 },
      uReveal: { value: 0 },
      uProgress: { value: 0 },
      uWhiteZone: { value: opts.state.whiteZone },
    },
  });
  const mesh = new Mesh(gl, { geometry: triangle, program });
  const fu = fieldProgram.uniforms;
  const u = program.uniforms;
  let frozenTime = 0;

  const view: GLView = {
    el: opts.el,
    fps: opts.fps,
    render(frame: Frame) {
      const { state } = opts;
      if (!state.still) frozenTime = frame.time;
      const cssW = frame.width / frame.dpr;
      const cssH = frame.height / frame.dpr;
      // Cells grow as the hero scrolls away.
      const cell = opts.cell * (1 + state.progress * 0.9);

      field.setSize(Math.ceil(cssW / opts.cell) + 1, Math.ceil(cssH / opts.cell) + 1);
      const cols = Math.min(field.width, Math.ceil(cssW / cell) + 1);
      const rows = Math.min(field.height, Math.ceil(cssH / cell) + 1);
      fu.uSize.value = [cssW, cssH];
      fu.uCell.value = cell;
      fu.uTime.value = frozenTime;
      renderer.bindFramebuffer(field);
      gl.disable(gl.SCISSOR_TEST);
      // Drive GL directly: OGL's setViewport ignores offset-only changes (see stage.ts).
      gl.viewport(0, 0, cols, rows);
      Object.assign(renderer.state.viewport, { x: 0, y: 0, width: cols, height: rows });
      fieldMesh.draw();
      frame.bindScreen();

      u.uRes.value = [frame.width, frame.height];
      u.uOffset.value = [frame.x, frame.y];
      u.uDpr.value = frame.dpr;
      u.uCell.value = cell;
      for (let i = 0; i < seamValues.length; i++) seamValues[i] = state.seam[i];
      u.uMouse.value = [state.mouse.x, state.mouse.y];
      u.uMouseForce.value = state.mouseForce;
      u.uReveal.value = state.reveal;
      u.uProgress.value = state.progress;
      u.uWhiteZone.value = state.whiteZone;
      mesh.draw();
    },
    dispose() {
      program.remove();
      fieldProgram.remove();
      triangle.remove();
      gl.deleteFramebuffer(field.buffer);
      gl.deleteTexture(field.texture.texture);
    },
  };
  return view;
}
