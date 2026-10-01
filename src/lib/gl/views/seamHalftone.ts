import { Mesh, Program, Triangle } from 'ogl';
import type { Frame, GLView, Stage } from '../stage';
import vertex from '../shaders/fullscreen.vert.glsl?raw';
import fragment from '../shaders/seam-halftone.frag.glsl?raw';

export interface SeamHalftoneState {
  seam: Float32Array;
  /** Pointer in CSS px relative to the view's top-left. */
  mouse: { x: number; y: number };
  mouseForce: number;
  reveal: number;
  progress: number;
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
  const { gl } = stage;
  const seamValues: number[] = Array.from(opts.state.seam);

  const program = new Program(gl, {
    vertex,
    fragment,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uRes: { value: [1, 1] },
      uOffset: { value: [0, 0] },
      uDpr: { value: 1 },
      uTime: { value: 0 },
      uCell: { value: opts.cell },
      // OGL only resolves `uSeam[0]` when the value is a real Array (not a typed array).
      uSeam: { value: seamValues },
      uMouse: { value: [-1e4, -1e4] },
      uMouseForce: { value: 0 },
      uReveal: { value: 0 },
      uProgress: { value: 0 },
    },
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  const u = program.uniforms;
  let frozenTime = 0;

  const view: GLView = {
    el: opts.el,
    fps: opts.fps,
    render(frame: Frame) {
      const { state } = opts;
      if (!state.still) frozenTime = frame.time;
      u.uRes.value = [frame.width, frame.height];
      u.uOffset.value = [frame.x, frame.y];
      u.uDpr.value = frame.dpr;
      u.uTime.value = frozenTime;
      for (let i = 0; i < seamValues.length; i++) seamValues[i] = state.seam[i];
      u.uMouse.value = [state.mouse.x, state.mouse.y];
      u.uMouseForce.value = state.mouseForce;
      u.uReveal.value = state.reveal;
      u.uProgress.value = state.progress;
      mesh.draw();
    },
    dispose() {
      program.remove();
      mesh.geometry.remove();
    },
  };
  return view;
}
