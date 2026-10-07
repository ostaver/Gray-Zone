import { Geometry, Mesh, Program } from 'ogl';
import type { Frame, GLView, Stage } from '../stage';
import vertex from '../shaders/dot-batch.vert.glsl?raw';
import fragment from '../shaders/dot-batch.frag.glsl?raw';

export type RGB = readonly [number, number, number];

export interface DotWriter {
  /** Queue one dot: centre in CSS px from the view's top-left, radius in CSS px. */
  dot(x: number, y: number, r: number, rgb: RGB, alpha?: number, squash?: number): void;
}

export interface DotBatchOptions {
  el: HTMLElement;
  /** Most dots one frame can hold; extra dots are dropped. */
  capacity: number;
  fps: number;
  /** Called at draw time to lay out this frame's dots. */
  fill(out: DotWriter, frame: Frame): void;
}

/**
 * Dots the CPU places every frame (simulations, scrubbed scenes), drawn as one batch of point
 * sprites: a single buffer upload and draw call per frame however many dots move.
 */
export function createDotBatch(stage: Stage, opts: DotBatchOptions): GLView {
  const { gl } = stage;
  const pos = new Float32Array(opts.capacity * 2);
  const shape = new Float32Array(opts.capacity * 2);
  const color = new Float32Array(opts.capacity * 4);
  const geometry = new Geometry(gl, {
    aPos: { size: 2, data: pos, usage: gl.DYNAMIC_DRAW },
    aShape: { size: 2, data: shape, usage: gl.DYNAMIC_DRAW },
    aColor: { size: 4, data: color, usage: gl.DYNAMIC_DRAW },
  });
  const program = new Program(gl, {
    vertex,
    fragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: { uSize: { value: [1, 1] }, uDpr: { value: 1 } },
  });
  const mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program });

  let count = 0;
  const writer: DotWriter = {
    dot(x, y, r, rgb, alpha = 1, squash = 1) {
      if (count >= opts.capacity || r <= 0 || alpha <= 0) return;
      pos[count * 2] = x;
      pos[count * 2 + 1] = y;
      shape[count * 2] = r;
      shape[count * 2 + 1] = squash;
      color.set(rgb, count * 4);
      color[count * 4 + 3] = alpha;
      count++;
    },
  };

  return {
    el: opts.el,
    fps: opts.fps,
    render(frame) {
      count = 0;
      opts.fill(writer, frame);
      if (count === 0) return;
      geometry.attributes.aPos.needsUpdate = true;
      geometry.attributes.aShape.needsUpdate = true;
      geometry.attributes.aColor.needsUpdate = true;
      geometry.setDrawRange(0, count);
      program.uniforms.uSize.value = [frame.width / frame.dpr, frame.height / frame.dpr];
      program.uniforms.uDpr.value = frame.dpr;
      mesh.draw();
    },
    dispose() {
      program.remove();
      geometry.remove();
    },
  };
}
