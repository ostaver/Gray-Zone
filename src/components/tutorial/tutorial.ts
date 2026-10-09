import { gsap, ScrollTrigger } from '../../lib/motion/gsap';
import { onCleanup } from '../../lib/lifecycle';

/** Seconds the ring holds on a step (its bar filling) before turning to the next. */
const HOLD = 6;
/** After the reader drags, picks or pages, the ring waits this long before turning on its own. */
const IDLE = 8;
/** Time constant of the ring's ease toward where it's headed, s. */
const TURN = 0.3;
/** How far back a drag's release looks to tell its speed, ms. */
const FLICK_MS = 100;
/** Release speed that counts as a flick, px/ms. */
const FLICK_SPEED = 0.3;
/** Steps of swing per px/s of page scroll, and the most it swings either way. */
const SWING = 0.00014;
const SWING_MAX = 0.45;

export function initTutorial(root: HTMLElement): void {
  const media = gsap.matchMedia();
  media.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => initRing(root));
  media.add('(max-width: 899px) and (prefers-reduced-motion: no-preference)', () => initCarousel(root));
  onCleanup(() => media.revert());
}

/** Phones show the original screenshot and copy together, with no autoplay or duplicated slides. */
function initCarousel(root: HTMLElement): () => void {
  const steps = [...root.querySelectorAll<HTMLElement>('[data-tu-step]')];
  const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-tu-go]')];
  const controls = root.querySelector<HTMLElement>('[data-tu-controls]')!;
  const events = new AbortController();
  const copy = root.querySelector<HTMLElement>('.tu__steps')!;
  copy.setAttribute('aria-live', 'polite');
  copy.setAttribute('aria-atomic', 'true');
  const { signal } = events;
  let active = Math.max(0, steps.findIndex((step) => step.hasAttribute('data-on')));
  root.dataset.carousel = '';
  const show = (index: number) => {
    active = (index + steps.length) % steps.length;
    steps.forEach((step, i) => step.toggleAttribute('data-on', i === active));
    dots.forEach((dot, i) => {
      if (i === active) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    });
    const dot = dots[active];
    const list = dot.closest<HTMLElement>('.tu__index')!;
    list.scrollLeft = dot.offsetLeft - list.offsetLeft - (list.clientWidth - dot.offsetWidth) / 2;
  };
  show(active);
  controls.querySelectorAll<HTMLElement>('[data-tu-step-by]').forEach((button) => {
    button.addEventListener('click', () => show(active + Number(button.dataset.tuStepBy)), { signal });
  });
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i), { signal }));
  controls.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    show(event.key === 'Home' ? 0 : event.key === 'End' ? steps.length - 1 : active + (event.key === 'ArrowRight' ? 1 : -1));
    dots[active].focus({ preventScroll: true });
  }, { signal });
  return () => {
    events.abort();
    delete root.dataset.carousel;
    copy.removeAttribute('aria-live');
    copy.removeAttribute('aria-atomic');
  };
}

/**
 * The steps' screens stand on a tilted ring that turns by itself: it holds on a step while that
 * step's bar fills, then turns to the next. A drag spins it (a flick coasts on a step or two) and
 * it settles on the nearest screen; clicking a screen, a step's number or the arrows turns it
 * there. Page scroll swings it with the flow and it springs back. The step facing front is the
 * one whose copy shows under the ring. Without JS or with reduced motion the list stays a list.
 */
function initRing(root: HTMLElement): () => void {
  const events = new AbortController();
  const { signal } = events;
  const stage = root.querySelector<HTMLElement>('[data-tu-stage]')!;
  const ring = root.querySelector<HTMLElement>('[data-tu-ring]')!;
  const cards = [...root.querySelectorAll<HTMLElement>('[data-tu-card]')];
  const shades = [...root.querySelectorAll<HTMLElement>('[data-tu-shade]')];
  const steps = [...root.querySelectorAll<HTMLElement>('[data-tu-step]')];
  const names = [...root.querySelectorAll<HTMLElement>('[data-tu-name]')];
  const bodies = [...root.querySelectorAll<HTMLElement>('[data-tu-body]')];
  const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-tu-go]')];
  const fills = [...root.querySelectorAll<HTMLElement>('[data-tu-fill]')];
  const controls = root.querySelector<HTMLElement>('[data-tu-controls]')!;
  const play = root.querySelector<HTMLButtonElement>('[data-tu-play]')!;
  const copy = root.querySelector<HTMLElement>('.tu__steps')!;
  const nameText = names.map((el) => el.textContent ?? '');
  const n = cards.length;
  const angle = 360 / n;
  root.dataset.ring = '';
  steps.forEach((step, i) => step.toggleAttribute('data-on', i === 0));
  dots.forEach((dot, i) => {
    if (i === 0) dot.setAttribute('aria-current', 'step');
    else dot.removeAttribute('aria-current');
  });

  /** Signed distance from step `from` to step `to` the short way round, in steps. */
  const around = (to: number, from: number) => ((((to - from) % n) + n * 1.5) % n) - n / 2;

  // Where the ring is and where it's headed, in steps (unwrapped: it loops).
  let pos = 0;
  let target = 0;
  /** Extra turn from page scroll, in steps; springs back to 0 when the page stops. */
  let swing = 0;
  /** Seconds held on the current step. */
  let held = 0;
  let active = 0;
  /** The ring has come on screen (and starts turning toward step 1). */
  let started = false;
  /** Its entrance is over: it turns on its own and the front step's copy follows it. */
  let entered = false;
  let paused = false;
  let reading = false;
  let focused = false;
  let dragging = false;
  let idleUntil = 0;

  /** The reader took the wheel: hold off turning on our own for a while. */
  const interact = () => {
    idleUntil = gsap.ticker.time + IDLE;
    held = 0;
  };
  const turnTo = (i: number) => {
    target = Math.round(target) + around(i, Math.round(target));
    interact();
  };
  const turnBy = (dir: number) => {
    target = Math.round(target) + dir;
    interact();
  };

  /** Step `i` faces front: its copy shows, its title decodes and its paragraphs rise in. */
  const show = (i: number) => {
    const was = active;
    active = i;
    steps[was].removeAttribute('data-on');
    dots[was].removeAttribute('aria-current');
    gsap.killTweensOf([names[was], ...bodies[was].children]);
    names[was].textContent = nameText[was];
    gsap.set(fills[was], { scaleX: 0 });
    steps[i].setAttribute('data-on', '');
    dots[i].setAttribute('aria-current', 'step');
    held = 0;
    reveal(i);
  };
  const reveal = (i: number) => {
    gsap.killTweensOf([names[i], ...bodies[i].children]);
    // Scrambles over its own length rather than typing out from empty, so the title keeps its
    // lines (and the copy its height) while it decodes.
    names[i].textContent = nameText[i];
    gsap.to(names[i], { scrambleText: { text: nameText[i], chars: nameText[i].replace(/\s/g, ''), speed: 0.6 }, duration: 0.8, ease: 'none' });
    gsap.fromTo(bodies[i].children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.07, delay: 0.1 });
  };

  // ── The frame loop ─────────────────────────────────
  let inView = false;
  const visibility = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting));
  visibility.observe(stage);
  let lastY = window.scrollY;
  let drawn = NaN;
  const tick = (time: number, deltaMs: number) => {
    const y = window.scrollY;
    const dt = Math.min(deltaMs, 100) / 1000;
    const speed = dt > 0 ? (y - lastY) / dt : 0;
    lastY = y;
    if (!inView || !started) return;

    // Turning on its own: hold, then on to the next step.
    const auto = entered && !paused && !reading && !focused && !dragging && time >= idleUntil;
    if (auto && Math.abs(target - pos) < 0.02) {
      held += dt;
      if (held >= HOLD) {
        held = 0;
        target = Math.round(target) + 1;
      }
    }
    gsap.set(fills[active], { scaleX: Math.min(1, held / HOLD) });

    if (!dragging) {
      pos += (target - pos) * (1 - Math.exp(-dt / TURN));
      if (Math.abs(target - pos) < 1e-4) pos = target;
    }
    const swingTo = gsap.utils.clamp(-SWING_MAX, SWING_MAX, speed * SWING);
    swing += (swingTo - swing) * (1 - Math.exp(-dt / 0.25));
    if (Math.abs(swing) < 1e-4) swing = 0;

    const at = pos + swing;
    if (at !== drawn) {
      drawn = at;
      ring.style.transform = `translateZ(calc(var(--radius) * -1)) rotateY(${-at * angle}deg)`;
      // Screens dim as they turn away from the front.
      shades.forEach((shade, i) => (shade.style.opacity = String(Math.min(0.8, Math.abs(around(i, at)) * 0.42))));
    }
    const front = ((Math.round(pos) % n) + n) % n;
    if (entered && front !== active) show(front);
  };
  gsap.ticker.add(tick);

  // ── Entrance: the ring fans out of one stack and spins round to the first step ─
  gsap.set(ring, { '--spread': 0, opacity: 0 });
  pos = -n * 0.4;
  const entrance = ScrollTrigger.create({
    trigger: stage,
    start: 'top 85%',
    once: true,
    onEnter: () => {
      started = true;
      gsap.to(ring, { opacity: 1, duration: 0.6, ease: 'power2.out' });
      gsap.to(ring, { '--spread': 1, duration: 1.8, ease: 'expo.out', onComplete: () => void (entered = true) });
      reveal(active);
    },
  });
  // The screens are lazy; fetch them all before the ring arrives so none turns in blank.
  const loader = new IntersectionObserver(
    ([entry], io) => {
      if (!entry.isIntersecting) return;
      ring.querySelectorAll('img').forEach((img) => (img.loading = 'eager'));
      io.disconnect();
    },
    { rootMargin: '100% 0px' },
  );
  loader.observe(stage);

  // ── Pointer: drag or flick to spin, click a screen to turn to it ─
  /** `trail`: where the pointer was over the last FLICK_MS, for a flick's speed. */
  let down: { x: number; pos: number; moved: boolean; trail: { x: number; t: number }[] } | null = null;
  /** px of drag per step turned: about one screen's width. */
  const stepPx = () => Math.max(1, cards[0].offsetWidth);
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    down = { x: e.clientX, pos, moved: false, trail: [{ x: e.clientX, t: e.timeStamp }] };
  }, { signal });
  stage.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x;
    if (!down.moved && Math.abs(dx) > 6) {
      down.moved = dragging = true;
      stage.setPointerCapture(e.pointerId);
      stage.dataset.dragging = '';
    }
    if (!down.moved) return;
    pos = target = down.pos - dx / stepPx();
    down.trail.push({ x: e.clientX, t: e.timeStamp });
    while (e.timeStamp - down.trail[0].t > FLICK_MS) down.trail.shift();
  }, { signal });
  const release = (e: PointerEvent) => {
    if (!down) return;
    const { moved, trail } = down;
    down = null;
    dragging = false;
    delete stage.dataset.dragging;
    interact();
    if (moved) {
      const from = trail.find((p) => e.timeStamp - p.t <= FLICK_MS);
      const v = from ? (e.clientX - from.x) / Math.max(16, e.timeStamp - from.t) : 0;
      // A slow or held drag settles on the nearest screen; a flick coasts on at least one step
      // its way, up to three if it's fast.
      if (Math.abs(v) < FLICK_SPEED) target = Math.round(pos);
      else {
        const coast = Math.round(pos - (v * 300) / stepPx());
        target = v < 0 ? gsap.utils.clamp(Math.floor(pos) + 1, Math.floor(pos) + 3, coast) : gsap.utils.clamp(Math.ceil(pos) - 3, Math.ceil(pos) - 1, coast);
      }
    } else if (e.type === 'pointerup') {
      const card = (e.target as Element).closest<HTMLElement>('[data-tu-card]');
      if (card) turnTo(cards.indexOf(card));
    }
  };
  stage.addEventListener('pointerup', release, { signal });
  stage.addEventListener('pointercancel', release, { signal });

  // ── Controls ───────────────────────────────────────
  controls.querySelectorAll<HTMLElement>('[data-tu-step-by]').forEach((btn) => {
    const dir = Number(btn.dataset.tuStepBy);
    btn.addEventListener('click', () => {
      turnBy(dir);
      // The chevron punches the way the ring goes.
      gsap.fromTo(btn.firstElementChild, { x: 8 * dir }, { x: 0, duration: 0.7, ease: 'elastic.out(1, 0.35)' });
    }, { signal });
  });
  dots.forEach((dot, i) => dot.addEventListener('click', () => turnTo(i), { signal }));
  controls.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    turnBy(e.key === 'ArrowRight' ? 1 : -1);
  }, { signal });
  play.addEventListener('click', () => {
    paused = !paused;
    play.toggleAttribute('data-paused', paused);
    play.setAttribute('aria-label', (paused ? play.dataset.labelPlay : play.dataset.labelPause) ?? '');
    if (!paused) idleUntil = 0;
  }, { signal });

  // Hold still while someone reads the copy or tabs through the controls.
  copy.addEventListener('pointerenter', (e) => (reading = e.pointerType === 'mouse'), { signal });
  copy.addEventListener('pointerleave', () => (reading = false), { signal });
  root.addEventListener('focusin', (e) => (focused = (e.target as Element).matches(':focus-visible')), { signal });
  root.addEventListener('focusout', () => (focused = false), { signal });
  return () => {
    events.abort();
    visibility.disconnect();
    loader.disconnect();
    entrance.kill();
    gsap.ticker.remove(tick);
    gsap.killTweensOf([ring, ...names, ...bodies.flatMap((body) => [...body.children]), ...fills]);
    gsap.set([ring, ...names, ...bodies.flatMap((body) => [...body.children]), ...fills], { clearProps: 'all' });
    names.forEach((name, i) => (name.textContent = nameText[i]));
    delete root.dataset.ring;
    delete stage.dataset.dragging;
    play.removeAttribute('data-paused');
    play.setAttribute('aria-label', play.dataset.labelPause ?? '');
  };
}
