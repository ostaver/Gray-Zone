import { Mesh, Program, Texture, Triangle } from 'ogl';
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
  imageUrl: string;
  cell: number;
  noiseMix: number;
  fps: number;
  state: SeamHalftoneState;
}

/** Halftone game art split by the torn seam: colour on one side, gray on the other. */
export function createSeamHalftone(stage: Stage, opts: SeamHalftoneOptions): { view: GLView; loaded: Promise<void> } {
  const { gl } = stage;
  const texture = new Texture(gl, { generateMipmaps: true });
  let imageAspect = 16 / 9;

  const load = Promise.withResolvers<void>();
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    texture.image = img;
    imageAspect = img.naturalWidth / img.naturalHeight;
    load.resolve();
  };
  // A missing texture still renders (noise-only field); never block the page on it.
  img.onerror = () => load.resolve();
  img.src = opts.imageUrl;
  const loaded = load.promise;

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
      uImage: { value: texture },
      uImageScale: { value: [1, 1] },
      uNoiseMix: { value: opts.noiseMix },
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
      const viewAspect = frame.width / frame.height;
      u.uRes.value = [frame.width, frame.height];
      u.uOffset.value = [frame.x, frame.y];
      u.uDpr.value = frame.dpr;
      u.uTime.value = frozenTime;
      // Cover-fit, except on tall screens: keep ≥70% of the art's width (stretching it
      // vertically; the halftone hides it) so the colourful street edges stay in frame.
      u.uImageScale.value = viewAspect > imageAspect ? [1, viewAspect / imageAspect] : [Math.min(imageAspect / viewAspect, 1 / 0.7), 1];
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
      gl.deleteTexture(texture.texture);
    },
  };
  return { view, loaded };
}
