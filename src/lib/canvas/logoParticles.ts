/**
 * Canvas2D halftone of the logo. Dots fly in from scatter and settle into the torn disc; the
 * disc can then turn and zoom about the viewport centre. Driven externally via `assemble`,
 * `rotation` (degrees) and `zoom`.
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

export class LogoParticles {
  assemble = 0;
  rotation = 0;
  zoom = 1;
  /** Logo diameter in CSS px (for laying out UI around it). */
  size = 0;
  private dots: Dot[] = [];
  private readonly ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly logo: HTMLImageElement,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2d context unavailable');
    this.ctx = ctx;
    this.layout();
  }

  layout(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);

    const size = Math.min(this.w * 0.6, this.h * 0.38, 360);
    this.size = size;
    // ~5.5px cells keep the lettering legible on phones; cap the count on large screens.
    const grid = Math.round(Math.max(36, Math.min(60, size / 5.5)));
    const cell = size / grid;
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
  }

  draw(): void {
    const { ctx, dpr } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // Turn + zoom about the viewport centre. Dots grow only with √zoom while the gaps grow
    // with zoom, so a zoomed logo thins out into a loose field.
    const a = (this.rotation * Math.PI) / 180;
    const k = dpr * this.zoom;
    const cos = Math.cos(a) * k;
    const sin = Math.sin(a) * k;
    ctx.setTransform(cos, sin, -sin, cos, (dpr * this.w) / 2, (dpr * this.h) / 2);
    const grow = 1 / Math.sqrt(this.zoom);
    const span = 0.6;
    for (const d of this.dots) {
      const t = Math.min(1, Math.max(0, (this.assemble - d.delay) / span));
      const e = 1 - Math.pow(1 - t, 4);
      if (e <= 0) continue;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.sx + (d.tx - d.sx) * e, d.sy + (d.ty - d.sy) * e, d.r * e * grow, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
