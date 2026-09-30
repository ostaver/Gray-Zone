/**
 * Canvas2D halftone of the logo. Dots fly in from scatter, settle into the torn disc,
 * then ride the two halves of the tear apart. Driven externally via `assemble` / `split`.
 */

interface Dot {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
  r: number;
  color: string;
  delay: number;
  side: -1 | 1;
}

const PAPER = '#efece6';
const RED = '#e3261f';
const SHADE = '#3a3a3a';

export class LogoParticles {
  assemble = 0;
  split = 0;
  /** Logo diameter in CSS px (for laying out UI around it). */
  size = 0;
  private dots: Dot[] = [];
  private readonly ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly logo: HTMLImageElement,
    /** Tear x (fraction of viewport width) at vertical fraction y. */
    private readonly tearAt: (y: number) => number,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2d context unavailable');
    this.ctx = ctx;
    this.layout();
  }

  layout(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

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

    const ox = this.w / 2 - size / 2;
    const oy = this.h / 2 - size / 2;
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
        const tx = ox + (gx + 0.5) * cell;
        const ty = oy + (gy + 0.5) * cell;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(this.w, this.h) * (0.35 + Math.random() * 0.5);
        dots.push({
          tx,
          ty,
          sx: this.w / 2 + Math.cos(angle) * dist,
          sy: this.h / 2 + Math.sin(angle) * dist,
          r: cell * (color === SHADE ? 0.34 : 0.42) * (0.75 + lum * 0.35),
          color,
          delay: Math.hypot(tx - this.w / 2, ty - this.h / 2) / size * 0.45 + Math.random() * 0.12,
          side: tx < this.tearAt(ty / this.h) * this.w ? -1 : 1,
        });
      }
    }
    this.dots = dots;
  }

  draw(): void {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.w, this.h);
    const span = 0.6;
    const splitE = this.split;
    for (const d of this.dots) {
      const t = Math.min(1, Math.max(0, (this.assemble - d.delay) / span));
      const e = 1 - Math.pow(1 - t, 4);
      if (e <= 0) continue;
      const x = d.sx + (d.tx - d.sx) * e + d.side * splitE * this.w * 0.04;
      const y = d.sy + (d.ty - d.sy) * e + d.side * splitE * this.h * 1.05;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(x, y, d.r * e, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
