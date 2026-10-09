import { gsap } from './gsap';

/**
 * Split-flap board: an element's text becomes a row of cells that clatter through letters and
 * land one after another, left to right, like a station departures board. The cells are built
 * here and styled in styles/flap.css (colour them with --flap-bg / --flap-fg, size them with
 * font-size). Only transforms move; the original text stays in the DOM for assistive tech.
 */

/** Cell width in em. The glyphs have to fit inside it. */
const CELL_W = 0.7;
/** Share of the cell a glyph may fill before it is squeezed (or kept out of the shuffle). */
const FILL = 0.9;
/** One flap's fall and rise, in seconds. */
const FLIP = 0.085;
const PERSPECTIVE = 'perspective(6em)';

const CYRILLIC = [...'АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШ'];
const LATIN = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

// A flap falls with gravity, rises decelerating, and the last one of a cell lands with a small
// rebound.
const fall = gsap.parseEase('power2.in');
const lift = gsap.parseEase('power2.out');
const land = gsap.parseEase('back.out(2.2)');

interface Cell {
  target: string;
  /** What the cell is showing (or has flipped to so far). */
  cur: string;
  el: HTMLElement;
  fold: HTMLElement;
  rise: HTMLElement;
  /** The four glyph layers: static top and bottom, the falling flap, the rising flap. */
  glyphs: [HTMLElement, HTMLElement, HTMLElement, HTMLElement];
  /** The run in progress: letters passed through (ending on the target), and where it is. */
  seq: string[];
  start: number;
  j: number;
  phase: number;
  done: boolean;
}

export interface FlapBoard {
  /** Empties every cell at once. */
  blank(): void;
  /** Shows the text at once. */
  settle(): void;
  /** Flips from whatever is showing to the text. */
  flip(): gsap.core.Tween;
}

let ruler: CanvasRenderingContext2D | null = null;
/** Advance widths, in em, of the characters in the element's font. */
function measure(el: HTMLElement, chars: string[]): Map<string, number> {
  ruler ??= document.createElement('canvas').getContext('2d')!;
  const style = getComputedStyle(el);
  ruler.font = `${style.fontWeight} 100px ${style.fontFamily}`;
  return new Map(chars.map((ch) => [ch, ruler!.measureText(ch).width / 100]));
}

export function flapBoard(el: HTMLElement): FlapBoard {
  const label = (el.textContent ?? '').trim();
  const text = [...label.toUpperCase()];
  const cells: Cell[] = [];
  let pool: string[] = [];

  el.textContent = '';
  el.style.setProperty('--flap-w', `${CELL_W}em`);
  const readout = document.createElement('span');
  readout.className = 'sr-only';
  readout.textContent = label;
  const track = document.createElement('span');
  track.className = 'flap-board__cells';
  track.setAttribute('aria-hidden', 'true');
  for (const ch of text) {
    if (ch === ' ') {
      track.append(Object.assign(document.createElement('span'), { className: 'flap-board__gap' }));
      continue;
    }
    const cell = document.createElement('span');
    cell.className = 'flap';
    cell.innerHTML =
      '<span class="flap__half flap__top"><span class="flap__ch"></span></span>' +
      '<span class="flap__half flap__bottom"><span class="flap__ch"></span></span>' +
      '<span class="flap__half flap__top flap__fold"><span class="flap__ch"></span></span>' +
      '<span class="flap__half flap__bottom flap__rise"><span class="flap__ch"></span></span>';
    const [top, bottom, fold, rise] = [...cell.children] as HTMLElement[];
    const glyphs = [top, bottom, fold, rise].map((half) => half.firstElementChild as HTMLElement) as Cell['glyphs'];
    cells.push({ target: ch, cur: ch, el: cell, fold, rise, glyphs, seq: [], start: 0, j: -1, phase: -1, done: true });
    track.append(cell);
  }
  el.append(readout, track);
  el.dataset.built = '';

  /** Glyph widths depend on the font, so this runs again once fonts have loaded. */
  const fit = () => {
    const widths = measure(el, [...new Set([...text, ...CYRILLIC, ...LATIN])]);
    const room = CELL_W * FILL;
    const alphabet = text.some((ch) => CYRILLIC.includes(ch)) ? CYRILLIC : LATIN;
    pool = alphabet.filter((ch) => (widths.get(ch) ?? 1) <= room);
    for (const c of cells) {
      c.el.style.setProperty('--fit', String(Math.min(1, room / (widths.get(c.target) ?? room))));
    }
  };
  fit();
  void document.fonts.ready.then(fit);

  /** Lays a cell flat showing one character. */
  const rest = (c: Cell, ch: string) => {
    c.cur = ch;
    c.j = -1;
    c.phase = -1;
    c.done = true;
    c.glyphs[0].textContent = ch;
    c.glyphs[1].textContent = ch;
    c.fold.style.visibility = 'hidden';
    c.rise.style.visibility = 'hidden';
    c.fold.style.transform = '';
    c.rise.style.transform = '';
  };
  for (const c of cells) rest(c, c.target);

  let tween: gsap.core.Tween | null = null;
  const stop = () => {
    tween?.kill();
    tween = null;
    gsap.killTweensOf(el);
    gsap.set(el, { clearProps: 'transform' });
  };

  /** Draws the board `t` seconds into a run. */
  const render = (t: number) => {
    for (const c of cells) {
      const local = (t - c.start) / FLIP;
      if (local < 0 || c.done) continue;
      const runs = c.seq.length - 1;
      if (local >= runs) {
        rest(c, c.target);
        continue;
      }
      const j = Math.floor(local);
      const f = local - j;
      if (j !== c.j) {
        // Static top already shows the new letter, static bottom still the old; the flaps carry
        // the old top down and the new bottom up.
        const [from, to] = [c.seq[j], c.seq[j + 1]];
        c.j = j;
        c.cur = to;
        c.phase = -1;
        c.glyphs[0].textContent = to;
        c.glyphs[1].textContent = from;
        c.glyphs[2].textContent = from;
        c.glyphs[3].textContent = to;
      }
      if (f < 0.5) {
        if (c.phase !== 0) {
          c.phase = 0;
          c.fold.style.visibility = 'visible';
          c.rise.style.visibility = 'hidden';
        }
        c.fold.style.transform = `${PERSPECTIVE} rotateX(${-90 * fall(f * 2)}deg)`;
      } else {
        if (c.phase !== 1) {
          c.phase = 1;
          c.fold.style.visibility = 'hidden';
          c.rise.style.visibility = 'visible';
        }
        const p = (f - 0.5) * 2;
        c.rise.style.transform = `${PERSPECTIVE} rotateX(${90 * (1 - (j === runs - 1 ? land(p) : lift(p)))}deg)`;
      }
    }
  };

  return {
    blank() {
      stop();
      for (const c of cells) rest(c, '');
    },
    settle() {
      stop();
      for (const c of cells) rest(c, c.target);
    },
    flip() {
      stop();
      // Left to right, each cell landing a beat after the last; the further along, the longer it
      // has shuffled.
      const gap = gsap.utils.clamp(0.05, 0.11, 0.85 / Math.max(1, cells.length));
      let total = 0;
      cells.forEach((c, i) => {
        c.start = Math.random() * 0.06;
        const runs = Math.max(3, Math.round((0.45 + i * gap - c.start) / FLIP));
        const seq = [c.cur];
        while (seq.length < runs) {
          const prev = seq[seq.length - 1];
          const next = pool[Math.floor(Math.random() * pool.length)] ?? c.target;
          if (next !== prev && (next !== c.target || pool.length < 3)) seq.push(next);
          else if (pool.length < 2) seq.push(next);
        }
        seq.push(c.target);
        c.seq = seq;
        c.done = false;
        c.j = -1;
        c.phase = -1;
        total = Math.max(total, c.start + runs * FLIP);
      });
      const clock = { t: 0 };
      tween = gsap.to(clock, {
        t: total,
        duration: total,
        ease: 'none',
        onUpdate: () => render(clock.t),
        onComplete: () => {
          render(total + 1);
          // The last flap lands hard enough to jolt the whole board.
          gsap.fromTo(el, { y: 2.5 }, { y: 0, duration: 0.5, ease: 'elastic.out(1, 0.35)', clearProps: 'transform' });
        },
      });
      return tween;
    },
  };
}
