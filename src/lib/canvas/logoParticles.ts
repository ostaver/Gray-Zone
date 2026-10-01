import { Geometry, Mesh, Program, Renderer } from 'ogl';
import vertex from '../gl/shaders/logo-dots.vert.glsl?raw';
import fragment from '../gl/shaders/logo-dots.frag.glsl?raw';

/**
 * Halftone of the logo. Dots fly in from scatter and settle into the torn disc; the disc can
 * then turn and zoom about the viewport centre. Driven externally via `assemble`, `rotation`
 * (degrees) and `zoom`.
 *
 * Rendered as WebGL points in a short-lived context of its own (one draw call per frame; the
 * page stage sits under the overlay). Canvas2D arcs are the fallback without WebGL: at ~2k
 * dots they saturate integrated GPUs once the dots grow, so they are the slow path only.
 */

/** Positions are relative to the viewport centre, CSS px. */
interface Dot {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  r: number;
  color: string;
  delay: number;
}

const PAPER = '#efece6';
const RED = '#e3261f';
const SHADE = '#3a3a3a';
const RGB: Record<string, [number, number, number]> = {
  [PAPER]: [0.937, 0.925, 0.902],
  [RED]: [0.89, 0.149, 0.122],
  [SHADE]: [0.227, 0.227, 0.227],
};

export class LogoParticles {
  assemble = 0;
  rotation = 0;
  zoom = 1;
  /** Logo diameter in CSS px (for laying out UI around it). */
  size = 0;
  /** Dot grid pitch in CSS px. */
  cell = 0;
  private dots: Dot[] = [];
  private w = 0;
  private h = 0;
  private dpr = 1;
  /** Inputs of the last drawn frame; an unchanged frame is not redrawn. */
  private readonly drawn = { assemble: NaN, rotation: NaN, zoom: NaN };
  private readonly gl: { renderer: Renderer; program: Program; mesh: Mesh | null } | null;
  private readonly ctx: CanvasRenderingContext2D | null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly logo: HTMLImageElement,
  ) {
    this.gl = createGL(canvas);
    this.ctx = this.gl ? null : canvas.getContext('2d');
    if (!this.gl && !this.ctx) throw new Error('no canvas context');
    this.layout();
  }

  layout(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    if (this.gl) {
      this.gl.renderer.dpr = dpr;
      this.gl.renderer.setSize(this.w, this.h);
    } else {
      this.canvas.width = Math.round(this.w * dpr);
      this.canvas.height = Math.round(this.h * dpr);
    }
    this.drawn.assemble = NaN;

    const size = Math.min(this.w * 0.6, this.h * 0.38, 360);
    this.size = size;
    // ~5.5px cells keep the lettering legible on phones; cap the count on large screens.
    const grid = Math.round(Math.max(36, Math.min(60, size / 5.5)));
    const cell = size / grid;
    this.cell = cell;
    const sample = document.createElement('canvas');
    sample.width = sample.height = grid;
    const sctx = sample.getContext('2d', { willReadFrequently: true });
    if (!sctx) return;
    sctx.drawImage(this.logo, 0, 0, grid, grid);
    const { data } = sctx.getImageData(0, 0, grid, grid);

    const o = -size / 2;
    const dots: Dot[] = [];
    for (let gy = 0; gy < grid; gy++) {
      for (let gx = 0; gx < grid; gx++) {
        const i = (gy * grid + gx) * 4;
        const a = data[i + 3] / 255;
        if (a < 0.5) continue;
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const color = lum > 0.62 ? PAPER : r > 0.35 && r > g * 1.8 ? RED : SHADE;
        const tx = o + (gx + 0.5) * cell;
        const ty = o + (gy + 0.5) * cell;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(this.w, this.h) * (0.35 + Math.random() * 0.5);
        dots.push({
          tx,
          ty,
          sx: Math.cos(angle) * dist,
          sy: Math.sin(angle) * dist,
          r: cell * (color === SHADE ? 0.34 : 0.42) * (0.75 + lum * 0.35),
          color,
          delay: Math.hypot(tx, ty) / size * 0.45 + Math.random() * 0.12,
        });
      }
    }
    this.dots = dots;
    if (this.gl) this.upload(this.gl, dots);
  }

  draw(): void {
    const { drawn } = this;
    if (drawn.assemble === this.assemble && drawn.rotation === this.rotation && drawn.zoom === this.zoom) return;
    drawn.assemble = this.assemble;
    drawn.rotation = this.rotation;
    drawn.zoom = this.zoom;
    const a = (this.rotation * Math.PI) / 180;

    if (this.gl) {
      const { renderer, program, mesh } = this.gl;
      const u = program.uniforms;
      u.uRes.value = [this.w, this.h];
      u.uDpr.value = this.dpr;
      u.uAssemble.value = this.assemble;
      u.uSpin.value = [Math.cos(a), Math.sin(a)];
      u.uZoom.value = this.zoom;
      if (mesh) renderer.render({ scene: mesh, clear: true });
      return;
    }

    const ctx = this.ctx!;
    const k = this.dpr * this.zoom;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(Math.cos(a) * k, Math.sin(a) * k, -Math.sin(a) * k, Math.cos(a) * k, (this.dpr * this.w) / 2, (this.dpr * this.h) / 2);
    const grow = 1 / Math.sqrt(this.zoom);
    for (const d of this.dots) {
      const t = Math.min(1, Math.max(0, (this.assemble - d.delay) / 0.6));
      const e = 1 - Math.pow(1 - t, 4);
      if (e <= 0) continue;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.sx + (d.tx - d.sx) * e, d.sy + (d.ty - d.sy) * e, d.r * e * grow, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /** Releases the WebGL context (the overlay is about to be removed). */
  dispose(): void {
    this.gl?.renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  private upload(gl: NonNullable<LogoParticles['gl']>, dots: Dot[]): void {
    const n = dots.length;
    const start = new Float32Array(n * 2);
    const target = new Float32Array(n * 2);
    const radius = new Float32Array(n);
    const delay = new Float32Array(n);
    const color = new Float32Array(n * 3);
    dots.forEach((d, i) => {
      start.set([d.sx, d.sy], i * 2);
      target.set([d.tx, d.ty], i * 2);
      radius[i] = d.r;
      delay[i] = d.delay;
      color.set(RGB[d.color], i * 3);
    });
    gl.mesh?.geometry.remove();
    const geometry = new Geometry(gl.renderer.gl, {
      aStart: { size: 2, data: start },
      aTarget: { size: 2, data: target },
      aRadius: { size: 1, data: radius },
      aDelay: { size: 1, data: delay },
      aColor: { size: 3, data: color },
    });
    gl.mesh = new Mesh(gl.renderer.gl, { mode: gl.renderer.gl.POINTS, geometry, program: gl.program });
  }
}

function createGL(canvas: HTMLCanvasElement): LogoParticles['gl'] {
  let renderer: Renderer;
  try {
    renderer = new Renderer({ canvas, alpha: true, premultipliedAlpha: true, antialias: false, depth: false, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  if (!renderer.gl) return null;
  const program = new Program(renderer.gl, {
    vertex,
    fragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uRes: { value: [1, 1] },
      uDpr: { value: 1 },
      uAssemble: { value: 0 },
      uSpin: { value: [1, 0] },
      uZoom: { value: 1 },
    },
  });
  renderer.gl.clearColor(0, 0, 0, 0);
  return { renderer, program, mesh: null };
}
