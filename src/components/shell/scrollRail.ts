import { gsap, reducedMotion } from '../../lib/motion/gsap';
import { scrollToTarget } from '../../lib/motion/scroll';
import { onCleanup } from '../../lib/lifecycle';

/** Where a section counts as being read, as a fraction of the viewport; the nav uses the same line. */
const READING_LINE = 0.4;
/** The thumb's stretch: how fast it follows the page's speed, and how far it may go. */
const SQUASH_TAU = 0.12;
const SQUASH_PER_PX_PER_SEC = 0.0007;
const SQUASH_MAX = 2.2;
/** How long the rail stays lit after the page stops moving, in ms. */
const AWAKE_MS = 1100;

/** The custom scrollbar: thumb, section marks, drag and click-to-jump. */
export function initScrollRail(rail: HTMLElement): void {
  const track = rail.querySelector<HTMLElement>('[data-rail-track]')!;
  const thumb = rail.querySelector<HTMLElement>('[data-rail-thumb]')!;
  const goo = rail.querySelector<HTMLElement>('[data-rail-goo]')!;
  const read = rail.querySelector<HTMLElement>('[data-rail-read]')!;
  const marks = [...rail.querySelectorAll<HTMLElement>('[data-rail-mark]')].flatMap((mark) => {
    const el = document.getElementById(mark.dataset.railMark!);
    if (!el) mark.hidden = true;
    return el ? [{ mark, el, num: mark.querySelector<HTMLElement>('.rail__num')!, top: 0 }] : [];
  });
  const controller = new AbortController();
  const options = { signal: controller.signal };

  let max = 0;
  let travel = 0;
  let thumbH = 0;
  const measure = () => {
    max = document.documentElement.scrollHeight - innerHeight;
    rail.toggleAttribute('data-empty', max < 2);
    const trackH = track.clientHeight;
    thumbH = Math.max(40, Math.round(trackH * Math.min(1, innerHeight / (max + innerHeight))));
    travel = trackH - thumbH;
    thumb.style.setProperty('--thumb-h', `${thumbH}px`);
    for (const m of marks) {
      m.top = m.el.getBoundingClientRect().top + scrollY;
      // Where the thumb's centre sits the moment this section becomes the one being read.
      const p = gsap.utils.clamp(0, 1, (m.top - innerHeight * READING_LINE) / Math.max(1, max));
      m.mark.style.transform = `translateY(${(p * travel + thumbH / 2).toFixed(1)}px)`;
    }
    shownY = NaN;
  };

  // ── Drag and jump ──────────────────────────────────────────
  let drag: { y: number; scroll: number } | null = null;
  track.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || max < 2) return;
    e.preventDefault();
    const target = e.target as Element;
    const mark = marks.find((m) => m.mark.contains(target));
    if (mark) {
      scrollToTarget(mark.el, reducedMotion.matches ? 0 : 1.2);
      return;
    }
    if (!thumb.contains(target)) {
      // Jump so the thumb lands centred under the pointer, then keep dragging from there.
      const y = e.clientY - track.getBoundingClientRect().top - thumbH / 2;
      const to = gsap.utils.clamp(0, 1, y / Math.max(1, travel)) * max;
      scrollToTarget(to, 0);
      drag = { y: e.clientY, scroll: to };
    } else drag = { y: e.clientY, scroll: scrollY };
    track.setPointerCapture(e.pointerId);
    rail.toggleAttribute('data-drag', true);
  }, options);
  track.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const to = drag.scroll + ((e.clientY - drag.y) * max) / Math.max(1, travel);
    scrollToTarget(gsap.utils.clamp(0, max, to), 0);
  }, options);
  const release = () => {
    drag = null;
    rail.removeAttribute('data-drag');
  };
  track.addEventListener('pointerup', release, options);
  track.addEventListener('pointercancel', release, options);

  // ── Every frame ────────────────────────────────────────────
  let lastY = scrollY;
  let squash = 1;
  let down = true;
  let awakeUntil = 0;
  let current = -2;
  let shownY = NaN;
  let shownSquash = NaN;
  let shownRead = '';

  const tick = (time: number, deltaMs: number) => {
    const dt = Math.min(0.05, Math.max(0.001, deltaMs / 1000));
    const y = scrollY;
    const moved = y - lastY;
    lastY = y;
    const now = time * 1000;
    if (moved !== 0 || drag) awakeUntil = now + AWAKE_MS;
    const awake = now < awakeUntil;
    if (awake !== rail.hasAttribute('data-awake')) rail.toggleAttribute('data-awake', awake);

    const p = max > 0 ? gsap.utils.clamp(0, 1, y / max) : 0;
    const ty = Math.round(p * travel * 2) / 2;
    if (ty !== shownY) {
      shownY = ty;
      thumb.style.transform = `translateY(${ty}px)`;
    }

    // Stretched along its way by the page's speed, thinner as it lengthens, trailing behind.
    const speed = Math.abs(moved) / dt;
    const want = reducedMotion.matches ? 1 : Math.min(SQUASH_MAX, 1 + speed * SQUASH_PER_PX_PER_SEC);
    squash += (want - squash) * (1 - Math.exp(-dt / SQUASH_TAU));
    if (Math.abs(squash - 1) < 0.002) squash = 1;
    if (moved !== 0 && moved > 0 !== down) {
      down = moved > 0;
      goo.style.transformOrigin = down ? '50% 100%' : '50% 0%';
    }
    const s = Math.round(squash * 1000) / 1000;
    if (s !== shownSquash) {
      shownSquash = s;
      goo.style.transform = s === 1 ? '' : `scale(${(1 / Math.sqrt(s)).toFixed(3)}, ${s})`;
    }

    const pct = String(Math.round(p * 100)).padStart(2, '0');
    if (pct !== shownRead) {
      shownRead = pct;
      read.textContent = pct;
    }

    const line = y + innerHeight * READING_LINE;
    let c = -1;
    while (c + 1 < marks.length && marks[c + 1].top <= line) c++;
    if (c !== current) {
      marks[current]?.mark.removeAttribute('data-current');
      current = c;
      const m = marks[c];
      if (m) {
        m.mark.toggleAttribute('data-current', true);
        if (!reducedMotion.matches) {
          const text = m.num.textContent ?? '';
          gsap.to(m.num, { scrambleText: { text, chars: '0123456789', speed: 0.6 }, duration: 0.5, ease: 'none', overwrite: true });
        }
      }
    }
  };

  measure();
  gsap.ticker.add(tick);
  addEventListener('resize', measure, options);
  // Sections grow as images decode and pins add their spacers.
  const resize = new ResizeObserver(measure);
  resize.observe(document.body);
  void document.fonts.ready.then(measure);
  onCleanup(() => {
    controller.abort();
    resize.disconnect();
    gsap.ticker.remove(tick);
  });
}
