import { ScrollTrigger, coarsePointer, reducedMotion } from '../../lib/motion/gsap';
import { getStage } from '../../lib/gl/stage';
import { createDotBatch, type DotWriter, type RGB } from '../../lib/gl/views/dotBatch';
import { readColour } from '../../lib/gl/colour';
import { onZoneChange } from '../../lib/zone';
import { clockStart } from '../../data/about';

/**
 * "What the game keeps track of", played out rather than listed. Scrolling through the pinned
 * scene is a run of shortcuts: the gray zone eats the word INTEGRITY from the right, its red dots
 * chip off and fall into a pile of money, more and more eyes open and follow you (reputation),
 * and the flip-dot clock never stops; scrolling hard makes time fly. Scroll back and it all
 * reverses: every chip's path is a pure function of progress. The stage draws the dots; the eyes
 * are small SVGs over it, so their line work stays sharp.
 */

/** Progress over which the gray zone crosses the word, and the share of the word it leaves. */
const EAT_FROM = 0.08;
const EAT_TO = 0.84;
const KEEP = 0.14;
/** Progress a chip spends in the air between the word and the pile. */
const FLIGHT = 0.13;
/** Game minutes per second at rest, and extra per px/s of scroll speed. */
const CLOCK_RATE = 2;
const CLOCK_SCROLL = 1 / 25;
const STILL_PROGRESS = 0.55;
const MAX_CHIPS = 1400;

// 5×7 flip-dot digits, one 5-bit row each, top to bottom.
const DIGITS = [
  [14, 17, 19, 21, 25, 17, 14],
  [4, 12, 4, 4, 4, 4, 14],
  [14, 17, 1, 2, 4, 8, 31],
  [31, 2, 4, 2, 1, 17, 14],
  [2, 6, 10, 18, 31, 2, 2],
  [31, 16, 30, 1, 1, 17, 14],
  [6, 8, 16, 30, 17, 17, 14],
  [31, 1, 2, 4, 8, 8, 8],
  [14, 17, 17, 14, 17, 17, 14],
  [14, 17, 17, 15, 1, 2, 12],
];
/** Columns of "HH:MM": four digits, a one-column colon, a column of air between each. */
const CLOCK_COLS = 5 + 1 + 5 + 1 + 1 + 1 + 5 + 1 + 5;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Chip {
  hx: number;
  hy: number;
  /** Where it lands in the pile (or -1: it fades out in flight). */
  sx: number;
  sy: number;
  r: number;
  /** Radius once it's a coin in the pile (the pile's packing sets it, not the word's grid). */
  cr: number;
  /** Progress at which the gray zone reaches it; > 1 for the part of the word that survives. */
  t: number;
  hop: number;
  shade: number;
  seed: number;
}
interface Eye {
  x: number;
  y: number;
  /** Progress at which it opens. */
  at: number;
  period: number;
  phase: number;
  el: SVGSVGElement;
  lid: SVGGElement;
  iris: SVGGElement;
  /** What was last written to it, so a still eye costs no style writes. */
  shown: string;
}

// An eye (after the "eye alert" icon): an almond lid, and an iris ring with a glint that slides
// about inside it, clipped to the lid. User units: 20 × 10, the lid's corners at x = 0 and 20.
// Opening and blinking squash the lid group; its strokes don't scale, so a shut eye is a slit.
const SVG_NS = 'http://www.w3.org/2000/svg';
const EYE_CLIP = 'ab-eye-clip';
const EYE_DEFS = `<defs><clipPath id="${EYE_CLIP}"><path d="M0 10A12.5 12.5 0 0 1 20 10A12.5 12.5 0 0 1 0 10Z"/></clipPath></defs>`;
// The iris is drawn first, so the lid's line passes over it: the iris sits behind the lid.
const EYE = `<g class="ab__eye-lid"><g clip-path="url(#${EYE_CLIP})"><g class="ab__eye-iris"><circle cx="10" cy="10" r="4.5"/><path d="M11.93 8.41A2.5 2.5 0 0 1 8.41 11.93"/></g></g><path d="M.63 10A12 12 0 0 1 19.37 10A12 12 0 0 1 .63 10Z"/></g>`;
/** How far the iris can look sideways and up/down, user units. */
const LOOK_X = 2.8;
const LOOK_Y = 1.1;

function svg(markup: string, viewBox: string, className?: string): SVGSVGElement {
  const el = document.createElementNS(SVG_NS, 'svg');
  el.setAttribute('viewBox', viewBox);
  if (className) el.setAttribute('class', className);
  el.innerHTML = markup;
  return el;
}

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** Shared scratch colour: `mix` writes into it, and dot writers copy it straight away. */
const scratch: [number, number, number] = [0, 0, 0];
function mix(a: RGB, b: RGB, t: number): RGB {
  for (let i = 0; i < 3; i++) scratch[i] = a[i] + (b[i] - a[i]) * t;
  return scratch;
}

/** Deterministic 0..1 per integer (stable across re-layouts). */
function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** The torn front's sideways wobble at height y: ripped by hand, not ruled. */
function jag(y: number): number {
  return Math.sin(y * 0.09) * 0.6 + Math.sin(y * 0.23 + 1.7) * 0.3 + Math.sin(y * 0.57 + 4.1) * 0.1;
}

/** The scene's colours from the zone's tokens (all hex). */
function palette() {
  const style = getComputedStyle(document.documentElement);
  return {
    red: readColour(style, '--red'),
    deep: readColour(style, '--red-deep'),
    paper: readColour(style, '--paper'),
    ash: readColour(style, '--ash'),
  };
}

export function initTrade(section: HTMLElement): void {
  const stage = getStage();
  if (!stage) return;
  const still = reducedMotion.matches;
  const desktop = window.matchMedia('(min-width: 900px)');
  const pin = section.querySelector<HTMLElement>('[data-trade-pin]')!;
  const art = (id: string) => section.querySelector<HTMLElement>(`[data-trade-art="${id}"]`)!;
  const arts = { integrity: art('integrity'), reputation: art('reputation'), time: art('time'), money: art('money') };
  const wordText = arts.integrity.dataset.word ?? '';
  const dayEl = section.querySelector<HTMLElement>('[data-trade-day]');

  let colours = palette();
  onZoneChange(() => (colours = palette()));

  // ── Layout ─────────────────────────────────────────────────
  let chips: Chip[] = [];
  let eyes: Eye[] = [];
  let word = { left: 0, right: 0, top: 0, bottom: 0, eat: 1 };
  let clock = { x: 0, y: 0, pitch: 1 };
  const clockLevels = new Float32Array(CLOCK_COLS * 7);

  const boxOf = (el: HTMLElement, origin: DOMRect): Box => {
    const r = el.getBoundingClientRect();
    return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height };
  };

  const layout = () => {
    const origin = pin.getBoundingClientRect();
    const wordBox = boxOf(arts.integrity, origin);
    const eyesBox = boxOf(arts.reputation, origin);
    const clockBox = boxOf(arts.time, origin);
    const pileBox = boxOf(arts.money, origin);
    if (wordBox.w < 10 || wordBox.h < 10) return;

    // The word, sampled into a dot grid from a canvas rendering of it.
    const sample = document.createElement('canvas');
    sample.width = Math.ceil(wordBox.w);
    sample.height = Math.ceil(wordBox.h);
    const ctx = sample.getContext('2d', { willReadFrequently: true })!;
    const family = getComputedStyle(arts.integrity).getPropertyValue('--font-display').trim() || 'sans-serif';
    ctx.font = `700 100px ${family}`;
    const m = ctx.measureText(wordText);
    const capRatio = m.actualBoundingBoxAscent / 100;
    const size = Math.min((wordBox.h * 0.92) / capRatio, (wordBox.w * 0.995) / (m.width / 100));
    ctx.font = `700 ${size}px ${family}`;
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'alphabetic';
    const cap = capRatio * size;
    const baseline = (wordBox.h + cap) / 2;
    ctx.fillText(wordText, 0, baseline);
    const textW = ctx.measureText(wordText).width;
    const data = ctx.getImageData(0, 0, sample.width, sample.height).data;

    let cell = Math.max(3.5, Math.min(8, size / 16));
    const sampleAt = (c: number) => {
      const found: { x: number; y: number }[] = [];
      for (let y = c / 2; y < sample.height; y += c) {
        for (let x = c / 2; x < sample.width; x += c) {
          if (data[(Math.floor(y) * sample.width + Math.floor(x)) * 4 + 3] > 140) found.push({ x, y });
        }
      }
      return found;
    };
    let points = sampleAt(cell);
    while (points.length > MAX_CHIPS) {
      cell *= 1.12;
      points = sampleAt(cell);
    }

    word = { left: wordBox.x, right: wordBox.x + textW, top: wordBox.y + baseline - cap, bottom: wordBox.y + baseline, eat: textW * (1 - KEEP) };
    chips = points.map(({ x, y }, i) => {
      const hx = wordBox.x + x;
      const hy = wordBox.y + y;
      const frac = (word.right - hx) / word.eat;
      return {
        hx,
        hy,
        sx: 0,
        sy: 0,
        r: cell * 0.43,
        cr: cell * 0.43,
        // The leftmost part of the word is never reached: it survives the run.
        t: frac > 1 ? 2 : EAT_FROM + frac * (EAT_TO - EAT_FROM) + jag(hy) * 0.02 + hash(i) * 0.01,
        hop: 30 + hash(i + 7) * 90,
        shade: hash(i + 13),
        seed: hash(i + 29) * 100,
      };
    });

    // The pile: a mound of coins on the floor of its box, filled centre-first from the bottom,
    // one slot per chip in the order the chips break away.
    const falling = chips.filter((c) => c.t <= 1).sort((a, b) => a.t - b.t);
    const baseW = pileBox.w * 0.92;
    const moundH = pileBox.h * 0.9;
    // A heap, not a dome: a slightly convex cone (its area is baseW·moundH / 1.75).
    const pitch = Math.sqrt((baseW * moundH) / 1.75 / Math.max(1, falling.length * 0.866)) * 0.97;
    const coinR = Math.max(1.4, Math.min(cell * 0.9, pitch * 0.46));
    const cx = pileBox.x + pileBox.w / 2;
    const floor = pileBox.y + pileBox.h - coinR;
    const slope = moundH / (baseW / 2);
    const slots: { x: number; y: number; key: number }[] = [];
    for (let k = 0; ; k++) {
      const h = k * pitch * 0.866;
      if (h > moundH) break;
      const half = (baseW / 2) * Math.pow(1 - h / moundH, 0.75);
      const shift = k % 2 ? pitch / 2 : 0;
      for (let x = -Math.floor(half / pitch) * pitch + shift; x <= half; x += pitch) {
        // Loosely stacked; keyed along the cone's own slope, so it grows as ever larger heaps.
        const n = slots.length;
        slots.push({ x: cx + x + (hash(n * 3 + 1) - 0.5) * pitch * 0.3, y: floor - h + (hash(n * 3 + 2) - 0.5) * pitch * 0.25, key: h + Math.abs(x) * slope });
      }
    }
    slots.sort((a, b) => a.key - b.key);
    falling.forEach((chip, i) => {
      const slot = slots[i];
      chip.sx = slot ? slot.x : -1;
      chip.sy = slot ? slot.y : -1;
      if (slot) chip.cr = coinR;
    });

    // The crowd: a loose grid of eyes, opening one by one as the shortcuts pile up.
    const cols = Math.max(3, Math.min(8, Math.round(eyesBox.w / 72)));
    const rows = Math.max(2, Math.min(4, Math.round(eyesBox.h / 64)));
    const cw = eyesBox.w / cols;
    const ch = eyesBox.h / rows;
    const eyeW = Math.min(cw * 0.78, ch * 1.3);
    const order = Array.from({ length: cols * rows }, (_, i) => i).sort((a, b) => hash(a + 101) - hash(b + 101));
    eyes = order.map((i, rank) => {
      const x = ((i % cols) + 0.5 + (hash(i + 3) - 0.5) * 0.35) * cw;
      const y = (Math.floor(i / cols) + 0.5 + (hash(i + 5) - 0.5) * 0.3) * ch;
      const w = eyeW * (0.8 + hash(i + 9) * 0.35);
      const el = svg(EYE, '0 5 20 10', 'ab__eye');
      // One user unit wide, in px: the strokes are non-scaling.
      el.style.cssText = `left: ${x - w / 2}px; top: ${y - w / 4}px; width: ${w}px; height: ${w / 2}px; stroke-width: ${w / 20}px`;
      return {
        x: eyesBox.x + x,
        y: eyesBox.y + y,
        at: 0.1 + (rank / (cols * rows)) * 0.72,
        period: 3.5 + hash(i + 11) * 4,
        phase: hash(i + 17) * 8,
        el,
        lid: el.querySelector<SVGGElement>('.ab__eye-lid')!,
        iris: el.querySelector<SVGGElement>('.ab__eye-iris')!,
        shown: '',
      };
    });
    arts.reputation.replaceChildren(svg(EYE_DEFS, '0 0 0 0', 'ab__eye-defs'), ...eyes.map((e) => e.el));

    const clockPitch = Math.min(clockBox.w / CLOCK_COLS, clockBox.h / 7.6);
    clock = { x: clockBox.x, y: clockBox.y + (clockBox.h - clockPitch * 7) / 2, pitch: clockPitch };
  };

  // ── Inputs ─────────────────────────────────────────────────
  let target = still ? STILL_PROGRESS : 0;
  let progress = target;
  let scrollSpeed = 0;
  let minutes = clockStart;
  let shownDay = 1;
  const pointer = { x: -1e4, y: -1e4, on: false };

  if (!still) {
    ScrollTrigger.create({
      trigger: section,
      start: () => desktop.matches ? 'top top' : 'top bottom',
      end: () => desktop.matches ? 'bottom bottom' : 'bottom top',
      onUpdate: (self) => {
        target = self.progress;
        scrollSpeed = Math.max(scrollSpeed, Math.abs(self.getVelocity()));
      },
    });
    pin.addEventListener('pointermove', (e) => {
      const r = pin.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.on = e.pointerType === 'mouse';
    });
    pin.addEventListener('pointerleave', () => (pointer.on = false));
  }

  // ── Frame ──────────────────────────────────────────────────
  const fill = (out: DotWriter, time: number, dt: number) => {
    const { red, deep, paper, ash } = colours;
    if (!still) {
      progress += (target - progress) * Math.min(1, dt * 7);
      scrollSpeed *= Math.exp(-dt * 2.5);
      minutes += dt * (CLOCK_RATE + scrollSpeed * CLOCK_SCROLL);
    }
    const p = progress;

    // Where the gray zone's front is (it stops where the surviving part of the word begins),
    // and what the crowd is looking at.
    const front = Math.min(p, EAT_TO);
    const frontAt = (y: number) => word.right - ((front - EAT_FROM - jag(y) * 0.02) / (EAT_TO - EAT_FROM)) * word.eat;
    const midY = (word.top + word.bottom) / 2;
    const look = pointer.on ? pointer : { x: Math.min(word.right, frontAt(midY)), y: midY };

    // Reputation: eyes. Closed ones are slits; open ones follow you.
    for (const e of eyes) {
      const open = smooth(e.at, e.at + 0.05, p);
      const blinkT = still ? 1 : ((time + e.phase) % e.period) / 0.16;
      const blink = blinkT < 1 ? Math.sin(blinkT * Math.PI) : 0;
      const lid = 0.08 + 0.92 * open * (1 - blink);
      const dx = look.x - e.x;
      const dy = look.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, d / 160);
      const ix = (dx / d) * reach * LOOK_X;
      const iy = (dy / d) * reach * LOOK_Y;
      const shown = `${lid.toFixed(3)} ${open.toFixed(3)} ${ix.toFixed(2)} ${iy.toFixed(2)}`;
      if (shown === e.shown) continue;
      e.shown = shown;
      e.el.style.opacity = String(0.35 + 0.65 * open);
      // Squashed about the lid's middle line (y = 10).
      e.lid.setAttribute('transform', `translate(0 ${10 * (1 - lid)}) scale(1 ${lid})`);
      e.iris.setAttribute('transform', `translate(${ix} ${iy})`);
      e.iris.style.opacity = String(open);
    }

    // Time: flip-dot clock; each dot eases toward on/off, so a changing digit ripples.
    const m = Math.floor(minutes);
    const day = 1 + Math.floor(m / 1440);
    if (dayEl && day !== shownDay) {
      shownDay = day;
      dayEl.textContent = String(day);
    }
    const hh = Math.floor(m / 60) % 24;
    const mm = m % 60;
    const glyphs = [DIGITS[Math.floor(hh / 10)], DIGITS[hh % 10], null, DIGITS[Math.floor(mm / 10)], DIGITS[mm % 10]];
    const tick = (time % 1) < 0.5;
    let col = 0;
    const ease = still ? 1 : Math.min(1, dt * 12);
    for (const glyph of glyphs) {
      const w = glyph ? 5 : 1;
      for (let gx = 0; gx < w; gx++) {
        for (let gy = 0; gy < 7; gy++) {
          const on = glyph ? (glyph[gy] >> (4 - gx)) & 1 : gy === 2 || gy === 4 ? 1 : 0;
          const i = (col + gx) * 7 + gy;
          clockLevels[i] += (on - clockLevels[i]) * ease;
          const l = clockLevels[i];
          const x = clock.x + (col + gx + 0.5) * clock.pitch;
          const y = clock.y + (gy + 0.5) * clock.pitch;
          const colour = !glyph && on && tick ? red : mix(ash, paper, l);
          out.dot(x, y, clock.pitch * (0.11 + 0.31 * l), colour, 0.45 + 0.55 * l);
        }
      }
      col += w + 1;
    }

    // Integrity → money. Chips at home tremble just before the front reaches them; in flight
    // they arc over and blanch from red to paper; landed, they're coins in the pile.
    for (const c of chips) {
      const tau = (p - c.t) / FLIGHT;
      if (tau <= 0) {
        let x = c.hx;
        let y = c.hy;
        const warn = 1 + tau * (FLIGHT / 0.035);
        if (warn > 0 && !still) {
          x += Math.sin(time * 41 + c.seed) * warn * 1.3;
          y += Math.cos(time * 37 + c.seed) * warn * 1.3;
        }
        if (pointer.on) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < 70 && d > 0) {
            const push = (1 - d / 70) ** 2 * 14;
            x += (dx / d) * push;
            y += (dy / d) * push;
          }
        }
        out.dot(x, y, c.r * (1 - Math.max(0, warn) * 0.15), mix(deep, red, 0.55 + c.shade * 0.45));
        continue;
      }
      if (c.sx < 0) {
        // No room left in the pile: it burns out in the air.
        const k = Math.min(1, tau);
        out.dot(c.hx, c.hy + k * k * 120, c.r * (1 - k), red, 1 - k);
        continue;
      }
      const k = Math.min(1, tau);
      const x = c.hx + (c.sx - c.hx) * (k * (2 - k));
      const y = c.hy + (c.sy - c.hy) * k * k - c.hop * 4 * k * (1 - k);
      const colour = k < 1 ? mix(red, paper, smooth(0.25, 1, k)) : mix(ash, paper, 0.55 + c.shade * 0.45);
      out.dot(x, y, c.r + (c.cr - c.r) * k, colour);
    }

  };

  stage.add(
    createDotBatch(stage, {
      el: section.querySelector<HTMLElement>('[data-trade-gl]')!,
      capacity: MAX_CHIPS + CLOCK_COLS * 7,
      fps: coarsePointer.matches ? 30 : 60,
      fill: (out, frame) => fill(out, frame.time, frame.delta),
    }),
  );
  layout();
  section.dataset.live = '';
  new ResizeObserver(layout).observe(pin);
  void document.fonts.load(`700 100px ${getComputedStyle(arts.integrity).getPropertyValue('--font-display').trim()}`, wordText).then(layout);
}
