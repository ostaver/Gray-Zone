import { Renderer, type OGLRenderingContext } from 'ogl';
import { gsap, coarsePointer } from '../motion/gsap';

/**
 * One WebGL context for the whole page. A fixed, viewport-sized canvas sits behind the
 * content; each section registers a `GLView` anchored to a DOM element and is drawn into
 * that element's on-screen rect (viewport + scissor). Off-screen views are skipped.
 */

export interface Frame {
  gl: OGLRenderingContext;
  renderer: Renderer;
  /** Seconds since stage start. */
  time: number;
  /** Seconds since the previous rendered frame (clamped). */
  delta: number;
  /** View rect in CSS px, relative to the viewport. */
  rect: DOMRectReadOnly;
  /** View origin + size in device px, in gl_FragCoord space (origin bottom-left of canvas). */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Device px per CSS px. */
  dpr: number;
  /** Re-bind the screen framebuffer + this view's viewport/scissor (after an offscreen pass). */
  bindScreen(): void;
}

export interface GLView {
  el: HTMLElement;
  /** Idle frame-rate cap. Views render at full rate whenever their rect moves. */
  fps?: number;
  render(frame: Frame): void;
  dispose?(): void;
}

export interface Stage {
  renderer: Renderer;
  gl: OGLRenderingContext;
  dpr: number;
  add(view: GLView): () => void;
  /** Synchronously repaint visible views for a view-transition snapshot. */
  draw(): void;
}

let stage: Stage | null | undefined;

/** Returns the page stage, creating it on first call; `null` when WebGL is unavailable. */
export function getStage(): Stage | null {
  if (stage !== undefined) return stage;
  const canvas = document.getElementById('gl-stage');
  stage = canvas instanceof HTMLCanvasElement ? createStage(canvas) : null;
  if (!stage) document.documentElement.classList.add('no-webgl');
  return stage;
}

function createStage(canvas: HTMLCanvasElement): Stage | null {
  const dpr = Math.min(window.devicePixelRatio || 1, coarsePointer.matches ? 1.5 : 2);
  let renderer: Renderer;
  try {
    renderer = new Renderer({ canvas, dpr, alpha: true, premultipliedAlpha: true, antialias: false, depth: false, autoClear: false, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  const { gl } = renderer;
  // Views ship GLSL ES 3.00 shaders; WebGL1-only devices get the DOM fallbacks.
  if (!gl || !renderer.isWebgl2) return null;
  gl.clearColor(0, 0, 0, 0);

  const views = new Set<GLView>();
  const lastRects = new WeakMap<GLView, string>();
  const lastDraw = new WeakMap<GLView, number>();
  let visibleLastFrame = false;
  let lost = false;
  let prevTime = 0;

  const resize = () => {
    // OGL's setSize writes inline px sizes (300×150 at construction); CSS owns the box.
    canvas.style.removeProperty('width');
    canvas.style.removeProperty('height');
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    canvas.style.removeProperty('width');
    canvas.style.removeProperty('height');
    // Force every view to redraw at the new size.
    for (const v of views) lastRects.delete(v);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    lost = true;
    document.documentElement.classList.add('no-webgl');
  });

  const setViewport = (w: number, h: number, x: number, y: number) => {
    // OGL's setViewport skips when only the offset changes, so drive GL directly.
    gl.viewport(x, y, w, h);
    Object.assign(renderer.state.viewport, { x, y, width: w, height: h });
  };

  const tick = (time: number, force = false) => {
    if (lost || views.size === 0) return;
    const vw = canvas.clientWidth;
    const vh = canvas.clientHeight;

    // Views share one canvas: when any visible view moved or is due, repaint all visible views.
    const visible: { view: GLView; rect: DOMRect }[] = [];
    let needsDraw = force;
    for (const view of views) {
      const rect = view.el.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= vh || rect.right <= 0 || rect.left >= vw || rect.width === 0) continue;
      const key = `${rect.left}|${rect.top}|${rect.width}|${rect.height}`;
      if (lastRects.get(view) !== key) needsDraw = true;
      if (time - (lastDraw.get(view) ?? -1) >= 1 / (view.fps ?? 60) - 0.002) needsDraw = true;
      lastRects.set(view, key);
      visible.push({ view, rect });
    }
    if (visible.length === 0) {
      // Last view just scrolled out: wipe what it left behind, then idle.
      if (visibleLastFrame) clear();
      visibleLastFrame = false;
      return;
    }
    if (!needsDraw) return;

    clear();
    visibleLastFrame = true;
    const delta = Math.min(time - prevTime, 1 / 15);
    prevTime = time;
    const s = gl.drawingBufferWidth / vw;
    const ch = gl.drawingBufferHeight;

    gl.enable(gl.SCISSOR_TEST);
    for (const { view, rect } of visible) {
      const x = Math.round(rect.left * s);
      const y = Math.round(ch - rect.bottom * s);
      const w = Math.round(rect.width * s);
      const h = Math.round(rect.height * s);
      const bindScreen = () => {
        renderer.bindFramebuffer();
        setViewport(w, h, x, y);
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(x, y, w, h);
      };
      bindScreen();
      view.render({ gl, renderer, time, delta, rect, x, y, width: w, height: h, dpr: s, bindScreen });
      lastDraw.set(view, time);
    }
    gl.disable(gl.SCISSOR_TEST);
  };

  function clear() {
    gl.disable(gl.SCISSOR_TEST);
    renderer.bindFramebuffer();
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  gsap.ticker.add((time) => tick(time));

  return {
    renderer,
    gl,
    dpr,
    draw() {
      tick(gsap.ticker.time, true);
    },
    add(view) {
      views.add(view);
      return () => {
        views.delete(view);
        view.dispose?.();
        clear();
      };
    },
  };
}
