/**
 * The torn seam between the honest (colour) side and the gray zone.
 * One model feeds both the WebGL halftone (uniform array) and the DOM clip-paths,
 * so the headline tears exactly where the field does.
 */

export const SEAM_SAMPLES = 128;

export interface SeamInput {
  time: number;
  /** Seconds since last update. */
  dt: number;
  /** Target seam position, fraction of width (0..1). */
  target: number;
  /** Pointer in fractions of the hero (null when absent). */
  pointer: { x: number; y: number } | null;
  /** 0..1 scroll progress through the hero; sweeps the seam off the left edge. */
  progress: number;
  /** Freeze time-based motion (reduced motion). */
  still: boolean;
}

export class SeamModel {
  /** Seam x per row, fraction of width, top → bottom. */
  readonly xs = new Float32Array(SEAM_SAMPLES);
  /** Current (sprung) split position before scroll sweep. */
  split = 0.5;
  private velocity = 0;
  private readonly profile = new Float32Array(SEAM_SAMPLES);
  private bend = 0;
  private bendY = 0.5;

  constructor(seed = 7) {
    // Torn-paper profile: a random walk with occasional kinks, then smoothed a little.
    let rnd = seed;
    const random = () => {
      rnd = (rnd * 16807) % 2147483647;
      return (rnd - 1) / 2147483646;
    };
    let x = 0;
    let drift = 0;
    for (let i = 0; i < SEAM_SAMPLES; i++) {
      if (random() < 0.12) drift = (random() - 0.5) * 0.012;
      drift *= 0.85;
      x += drift + (random() - 0.5) * 0.006;
      x *= 0.94; // pull back toward the centre line so the tear stays vertical overall
      this.profile[i] = x;
    }
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 1; i < SEAM_SAMPLES - 1; i++) {
        this.profile[i] = (this.profile[i - 1] + this.profile[i] * 2 + this.profile[i + 1]) / 4;
      }
    }
    // Zero-mean, so `split` is where the tear actually sits.
    const mean = this.profile.reduce((a, b) => a + b, 0) / SEAM_SAMPLES;
    for (let i = 0; i < SEAM_SAMPLES; i++) this.profile[i] -= mean;
  }

  update({ time, dt, target, pointer, progress, still }: SeamInput): Float32Array {
    // Critically-damped-ish spring toward the target split.
    const k = 38;
    const c = 11;
    const step = Math.min(dt, 1 / 30);
    this.velocity += ((target - this.split) * k - this.velocity * c) * step;
    this.split += this.velocity * step;

    // Paper bulges toward the pointer at the pointer's height.
    const wantBend = pointer ? Math.max(-0.14, Math.min(0.14, (pointer.x - this.split) * 0.45)) : 0;
    this.bend += (wantBend - this.bend) * Math.min(1, step * 6);
    if (pointer) this.bendY += (pointer.y - this.bendY) * Math.min(1, step * 8);

    // Scrolling drags the tear off the left edge: the whole field falls into the gray zone.
    const sweep = -(progress ** 2.4) * 0.95;
    const t = still ? 0 : time;
    for (let i = 0; i < SEAM_SAMPLES; i++) {
      const y = i / (SEAM_SAMPLES - 1);
      const dy = (y - this.bendY) / 0.22;
      const wobble = Math.sin(y * 9 + t * 1.1) * 0.004 + Math.sin(y * 23 - t * 0.7) * 0.002;
      this.xs[i] = this.split + sweep + this.profile[i] + wobble + this.bend * Math.exp(-dy * dy);
    }
    return this.xs;
  }

  /** Seam x (fraction) at vertical fraction y, interpolated like the shader does. */
  at(y: number): number {
    const f = Math.min(1, Math.max(0, y)) * (SEAM_SAMPLES - 1);
    const i = Math.floor(f);
    const j = Math.min(i + 1, SEAM_SAMPLES - 1);
    return this.xs[i] + (this.xs[j] - this.xs[i]) * (f - i);
  }

  /**
   * CSS `polygon()` clipping an element to one side of the seam, in the element's local
   * (untransformed) px. `box` gives its on-screen top-left inside the hero plus the
   * screen/local scale, so translated or scaled elements still tear in the right place.
   */
  clipPolygon(
    side: 'left' | 'right',
    box: { left: number; top: number; width: number; height: number; sx: number; sy: number },
    heroW: number,
    heroH: number,
  ): string {
    const rows = 32;
    const pad = 40;
    const pts: string[] = [];
    // The polygon reaches far past the box: content that leaves it (the title's letters
    // scattering on scroll) still has to be split along the seam, not cut off at the box.
    const far = 1e4;
    const edge = side === 'left' ? -far : far;
    const xs: string[] = [];
    const ys: number[] = [];
    for (let r = 0; r <= rows; r++) {
      const ly = (r / rows) * (box.height + pad * 2) - pad;
      const heroX = this.at((box.top + ly * box.sy) / heroH) * heroW;
      xs.push(((heroX - box.left) / box.sx).toFixed(1));
      ys.push(ly);
    }
    // The seam is constant above and below the hero, so the first and last x continue outward.
    pts.push(`${edge}px ${-far}px`, `${xs[0]}px ${-far}px`);
    xs.forEach((x, r) => pts.push(`${x}px ${ys[r].toFixed(1)}px`));
    pts.push(`${xs[rows]}px ${far}px`, `${edge}px ${far}px`);
    return `polygon(${pts.join(',')})`;
  }
}
