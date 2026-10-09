import { Mesh, Plane, Program, Texture } from 'ogl';
import type { Frame, GLView, Stage } from '../stage';
import type { RGB } from './dotBatch';
import vertex from '../shaders/gallery.vert.glsl?raw';
import fragment from '../shaders/gallery.frag.glsl?raw';

export interface ArcGalleryState {
  /** Which screen is centred, in screens (fractional, unwrapped: it loops). */
  position: number;
  /** The page surface, which screens away from the centre fade toward. */
  ink: RGB;
}

export interface ArcGalleryOptions {
  el: HTMLElement;
  /** Texture URLs, one per screen. */
  srcs: string[];
  /** How far the screens either side of the centre lean with the arc, degrees. */
  tilt: number;
  state: ArcGalleryState;
}

/** The centred screen's box in CSS px, from the view's top-left. */
export interface ArcLayout {
  width: number;
  height: number;
  x: number;
  y: number;
  /** One screen's travel, CSS px (screen width plus gap). */
  step: number;
}

export interface ArcGallery extends GLView {
  /** Starts the texture downloads (call as the section nears the viewport). */
  load(): void;
  /** Index of the screen under a point (CSS px from the view's top-left), if any. */
  hit(x: number, y: number): number | null;
  layout(): ArcLayout;
  /** Ask for a redraw though nothing moved (the zone's colours changed). */
  invalidate(): void;
}

const ASPECT = 16 / 9;
const RADIUS_PX = 6;
/** A screen a step or more from the centre, against the centred one. */
const SIDE_SCALE = 0.88;
/** Seconds a screen takes to fade in once its texture arrives. */
const FADE = 0.6;

/**
 * Screens hung on a gentle arc that loops, after the "circular gallery" pattern: each screen is a
 * flat quad placed along the arc and tilted to follow it; the centred one is full size and in
 * colour, the rest smaller and quieter. Drawn into the page stage like every other view (one
 * shared context, the view's own rect and scissor). Everything is in CSS px, so one mesh and one
 * program draw every screen, and at rest the view asks the stage for no frames.
 */
export function createArcGallery(stage: Stage, opts: ArcGalleryOptions): ArcGallery {
  const { gl } = stage;
  const { srcs, state } = opts;
  const n = srcs.length;

  // Mutated in place per draw: OGL uploads them only when they change.
  const view = new Float32Array(2);
  const centre = new Float32Array(2);
  const size = new Float32Array(2);
  const program = new Program(gl, {
    vertex,
    fragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uMap: { value: null },
      uLoaded: { value: 0 },
      uFocus: { value: 1 },
      uView: { value: view },
      uCentre: { value: centre },
      uSize: { value: size },
      uAngle: { value: 0 },
      uRadius: { value: RADIUS_PX },
      uInk: { value: state.ink },
    },
  });
  const geometry = new Plane(gl);
  const mesh = new Mesh(gl, { geometry, program });

  const blank = () => new Texture(gl, { generateMipmaps: false, width: 1, height: 1, image: new Uint8Array([0, 0, 0, 0]) });
  const screens = srcs.map((src) => ({
    src,
    map: blank(),
    /** Stage time its texture arrived: -1 not yet, -2 arrived but not drawn yet. */
    loadedAt: -1,
    visible: false,
    x: 0,
    y: 0,
    angle: 0,
    scale: 1,
  }));

  // Frames are only needed while something changes: the arc turning, a screen fading in, the
  // zone's colours.
  let dirty = true;
  let fading = false;
  let drawnAt = NaN;

  let loading = false;
  let disposed = false;
  const load = () => {
    if (loading || disposed) return;
    loading = true;
    for (const screen of screens) {
      const img = new Image();
      img.decoding = 'async';
      img.src = screen.src;
      void img
        .decode()
        .then(() => {
          if (disposed) return;
          gl.deleteTexture(screen.map.texture);
          // Drawn below their size on 1x displays: trilinear mipmaps keep them clean.
          screen.map = new Texture(gl, { image: img, generateMipmaps: true, minFilter: gl.LINEAR_MIPMAP_LINEAR });
          screen.loadedAt = -2;
          dirty = true;
        })
        .catch(() => {});
    }
  };

  let cssW = 0;
  let cssH = 0;
  /** The arc's radius, px: the neighbours lean `tilt` degrees, whatever the view's size. */
  let radius = 1;
  /** How far below the view's middle the centred screen sits, clear of the section title. */
  let lift = 0;
  let current: ArcLayout = { width: 0, height: 0, x: 0, y: 0, step: 0 };

  const measure = (w: number, h: number) => {
    if (w === cssW && h === cssH) return current;
    cssW = w;
    cssH = h;
    // A little under half the view's height, narrower on portrait views.
    const height = Math.min(h * 0.48, (w * 0.84) / ASPECT);
    const width = height * ASPECT;
    const step = width * 1.1;
    lift = height * 0.08;
    radius = step / Math.sin((opts.tilt * Math.PI) / 180);
    current = { width, height, x: w / 2, y: h / 2 + lift, step };
    return current;
  };

  /** Where the arc puts a screen whose centre is `x` px from the middle (y up). */
  const place = (x: number) => {
    const ex = Math.min(Math.abs(x), radius);
    return { y: -lift - (radius - Math.sqrt(radius * radius - ex * ex)), angle: -Math.sign(x) * Math.asin(ex / radius) };
  };

  return {
    el: opts.el,
    get fps() {
      return dirty || fading || state.position !== drawnAt ? 60 : 0.2;
    },
    load,
    invalidate: () => void (dirty = true),
    layout: () => measure(opts.el.clientWidth, opts.el.clientHeight),
    hit(px, py) {
      const dx0 = px - cssW / 2;
      const dy0 = cssH / 2 - py;
      for (const [i, s] of screens.entries()) {
        if (!s.visible) continue;
        // Into the screen's own (tilted) frame.
        const dx = dx0 - s.x;
        const dy = dy0 - s.y;
        const c = Math.cos(s.angle);
        const sn = Math.sin(s.angle);
        if (Math.abs(dx * c + dy * sn) <= (current.width * s.scale) / 2 && Math.abs(dy * c - dx * sn) <= (current.height * s.scale) / 2) return i;
      }
      return null;
    },
    render(frame: Frame) {
      dirty = false;
      fading = false;
      drawnAt = state.position;
      const w = frame.width / frame.dpr;
      const h = frame.height / frame.dpr;
      const { width, height, step } = measure(w, h);
      const u = program.uniforms;
      view[0] = w;
      view[1] = h;
      u.uInk.value = state.ink;
      const total = step * n;

      for (const [i, s] of screens.entries()) {
        // Wrap so the arc loops: every screen sits within half a loop of the centre.
        const x = ((((i - state.position) * step) % total) + total * 1.5) % total - total / 2;
        s.visible = Math.abs(x) < w / 2 + width;
        if (!s.visible) continue;
        // 1 centred, 0 a screen away, eased so the centre holds a moment before letting go.
        const f = 1 - Math.min(1, Math.abs(x) / step);
        const focus = f * f * (3 - 2 * f);
        const { y, angle } = place(x);
        s.x = x;
        s.y = y;
        s.angle = angle;
        s.scale = SIDE_SCALE + (1 - SIDE_SCALE) * focus;

        if (s.loadedAt === -2) s.loadedAt = frame.time;
        const loaded = s.loadedAt < 0 ? 0 : Math.min(1, (frame.time - s.loadedAt) / FADE);
        if (s.loadedAt >= 0 && loaded < 1) fading = true;
        u.uMap.value = s.map;
        u.uLoaded.value = loaded;
        u.uFocus.value = focus;
        u.uAngle.value = angle;
        centre[0] = x;
        centre[1] = y;
        size[0] = width * s.scale;
        size[1] = height * s.scale;
        mesh.draw();
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const s of screens) gl.deleteTexture(s.map.texture);
      program.remove();
      geometry.remove();
    },
  };
}
