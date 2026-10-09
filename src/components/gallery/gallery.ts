import { gsap, ScrollTrigger, reducedMotion } from '../../lib/motion/gsap';
import { lockScroll } from '../../lib/motion/scroll';
import { getStage } from '../../lib/gl/stage';
import { readColour } from '../../lib/gl/colour';
import { createArcGallery, type ArcGalleryState } from '../../lib/gl/views/arcGallery';
import { onZoneChange } from '../../lib/zone';
import { onCleanup } from '../../lib/lifecycle';

interface Lightbox {
  /** The screen showing (or last shown). */
  current: number;
  open(index: number): void;
}

export function initGallery(root: HTMLElement): void {
  const box = initLightbox(root);
  const media = gsap.matchMedia();
  media.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => initArc(root, box));
  onCleanup(() => media.revert());
}

const ink = () => readColour(getComputedStyle(document.documentElement), '--ink');

/** How far back a drag's release looks to tell its speed, ms. */
const FLICK_MS = 100;
/** Release speed that counts as a flick, px/ms. */
const FLICK_SPEED = 0.3;

/** Scroll turns the arc at an ease: it slows onto every screen and picks up between them. */
const ease = (u: number) => {
  const whole = Math.floor(u);
  const t = u - whole;
  return whole + t - Math.sin(2 * Math.PI * t) / (2 * Math.PI);
};

/**
 * The screens hang on an arc drawn by the page stage (lib/gl/views/arcGallery.ts). The section
 * pins and scrolling turns the arc a screen per quarter viewport; a horizontal drag (or a flick)
 * turns it too. Whenever it comes to rest it settles on the nearest screen, whose caption shows
 * under it. Without WebGL the list stays a grid.
 */
function initArc(root: HTMLElement, box: Lightbox): (() => void) | undefined {
  const stage = getStage();
  if (!stage) return;
  const pin = root.querySelector<HTMLElement>('[data-gl-pin]')!;
  const el = root.querySelector<HTMLElement>('[data-gl-arc]')!;
  const shots = [...root.querySelectorAll<HTMLElement>('[data-gl-open]')];
  const names = [...root.querySelectorAll<HTMLElement>('[data-gl-name]')];
  const srcs = JSON.parse(el.dataset.srcs ?? '[]') as string[];
  const n = srcs.length;

  const state: ArcGalleryState = { position: 0, ink: ink() };
  const arc = createArcGallery(stage, { el, srcs, tilt: 8, state });
  const removeArc = stage.add(arc);
  const events = new AbortController();
  const { signal } = events;
  root.dataset.arc = '';
  const unsubscribeZone = onZoneChange(() => {
    state.ink = ink();
    arc.invalidate();
    // View Transitions pause rAF during capture; flush the stage synchronously (as hero.ts does).
    stage.draw();
  });
  const loader = new IntersectionObserver(
    ([entry], io) => {
      if (!entry.isIntersecting) return;
      arc.load();
      io.disconnect();
    },
    { rootMargin: '100% 0px' },
  );
  loader.observe(root);

  // The centred screen's box, which its caption and the keyboard ring are placed against.
  const resize = new ResizeObserver(() => {
    const { x, y, width, height } = arc.layout();
    pin.style.setProperty('--shot-x', `${x}px`);
    pin.style.setProperty('--shot-y', `${y}px`);
    pin.style.setProperty('--shot-w', `${width}px`);
    pin.style.setProperty('--shot-h', `${height}px`);
  });
  resize.observe(el);

  // Where the arc is headed, in screens: the page's scroll through the pin, plus an offset that
  // drags, settling and keyboard focus adjust.
  let fromScroll = 0;
  let offset = 0;
  let dragging = false;
  /** Come to rest on screen `at` (unwrapped): by default the one nearest where the arc is headed. */
  const settle = (at = Math.round(fromScroll + offset)) => {
    if (dragging) return;
    offset = at - fromScroll;
  };
  let settleCall: gsap.core.Tween | null = null;
  const trigger = ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      fromScroll = ease(self.progress * (n - 1));
      settleCall?.kill();
      settleCall = gsap.delayedCall(0.18, settle);
    },
  });
  /** Turn the arc the short way round to screen `i`. */
  const turnTo = (i: number) => {
    offset = i + n * Math.round((state.position - i) / n) - fromScroll;
  };

  let inView = false;
  const visibility = new IntersectionObserver(([entry]) => (inView = entry.isIntersecting));
  visibility.observe(pin);
  let named = names.findIndex((name) => name.hasAttribute('data-on'));
  const tick = (_time: number, deltaMs: number) => {
    if (!inView) return;
    const target = fromScroll + offset;
    state.position += (target - state.position) * (1 - Math.exp(-deltaMs / 120));
    // Land exactly, so the arc (and the stage) can come to rest.
    if (Math.abs(target - state.position) < 1e-4) state.position = target;
    const i = ((Math.round(state.position) % n) + n) % n;
    if (i === named) return;
    names[named]?.removeAttribute('data-on');
    names[i].setAttribute('data-on', '');
    named = i;
  };
  gsap.ticker.add(tick);

  // ── Pointer: drag or flick to turn, click a screen to open it ─
  const local = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    return arc.hit(e.clientX - r.left, e.clientY - r.top);
  };
  /** `trail`: where the pointer was over the last FLICK_MS, for a flick's speed. */
  let down: { pointerId: number; x: number; offset: number; moved: boolean; trail: { x: number; t: number }[] } | null = null;
  pin.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    down = { pointerId: e.pointerId, x: e.clientX, offset, moved: false, trail: [{ x: e.clientX, t: e.timeStamp }] };
  }, { signal });
  pin.addEventListener('pointermove', (e) => {
    if (!down) {
      if (e.pointerType === 'mouse') pin.toggleAttribute('data-over', local(e) !== null);
      return;
    }
    const dx = e.clientX - down.x;
    if (!down.moved && Math.abs(dx) > 6) {
      down.moved = dragging = true;
      pin.setPointerCapture(e.pointerId);
      pin.dataset.dragging = '';
      pin.removeAttribute('data-over');
    }
    if (!down.moved) return;
    offset = down.offset - dx / Math.max(1, arc.layout().step);
    down.trail.push({ x: e.clientX, t: e.timeStamp });
    while (e.timeStamp - down.trail[0].t > FLICK_MS) down.trail.shift();
  }, { signal });
  const release = (e: PointerEvent) => {
    if (!down) return;
    const { moved, trail } = down;
    down = null;
    dragging = false;
    delete pin.dataset.dragging;
    if (moved) {
      const from = trail.find((p) => e.timeStamp - p.t <= FLICK_MS);
      const v = from ? (e.clientX - from.x) / Math.max(16, e.timeStamp - from.t) : 0;
      // A slow or held drag settles where it is; a flick turns at least one screen its way, two
      // if it's fast.
      if (Math.abs(v) < FLICK_SPEED) settle();
      else {
        const at = fromScroll + offset;
        const coast = Math.round(at - (v * 240) / Math.max(1, arc.layout().step));
        const next = v < 0 ? Math.floor(at) + 1 : Math.ceil(at) - 1;
        settle(v < 0 ? Math.min(Math.max(next, coast), next + 1) : Math.max(Math.min(next, coast), next - 1));
      }
    } else if (e.type === 'pointerup') {
      const i = local(e);
      if (i === null) return;
      turnTo(i);
      box.open(i);
    }
  };
  pin.addEventListener('pointerup', release, { signal });
  pin.addEventListener('pointercancel', release, { signal });
  pin.addEventListener('pointerleave', () => pin.removeAttribute('data-over'), { signal });

  // ── Keyboard: focusing a screen's link turns the arc to it ─
  shots.forEach((shot, i) => {
    shot.addEventListener('focus', () => turnTo(i), { signal });
    shot.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      shots[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n].focus();
    }, { signal });
  });
  // The screen paged to in the lightbox is the one centred when it closes.
  root.addEventListener('gl:closed', () => shots[box.current]?.focus({ preventScroll: true }), { signal });
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (down && pin.hasPointerCapture(down.pointerId)) pin.releasePointerCapture(down.pointerId);
    down = null;
    events.abort();
    settleCall?.kill();
    trigger.kill();
    gsap.ticker.remove(tick);
    loader.disconnect();
    resize.disconnect();
    visibility.disconnect();
    unsubscribeZone();
    removeArc();
    delete root.dataset.arc;
    delete pin.dataset.dragging;
    delete pin.dataset.over;
    for (const prop of ['--shot-x', '--shot-y', '--shot-w', '--shot-h']) pin.style.removeProperty(prop);
    ScrollTrigger.refresh();
  };
  document.querySelector('#gl-stage')?.addEventListener('webglcontextlost', cleanup, { signal });
  return cleanup;
}

/**
 * Screens open full size in a dialog, thrown in like sheets onto a desk: each flies in from a side,
 * spinning, lands with a jolt and wobbles still while its caption scrambles in; then the controls
 * skid and drop in after it. Paging flings the sheet off one side as the next lands from the
 * other; closing tosses it away.
 */
function initLightbox(root: HTMLElement): Lightbox {
  const dialog = root.querySelector<HTMLDialogElement>('[data-gl-box]')!;
  const desk = dialog.querySelector<HTMLElement>('.gl-box__stage')!;
  const figs = [...dialog.querySelectorAll<HTMLElement>('[data-gl-fig]')];
  const sheets = figs.map((fig) => fig.querySelector('img')!);
  const captions = figs.map((fig) => fig.querySelector('figcaption')!);
  const names = captions.map((caption) => caption.textContent ?? '');
  const closer = dialog.querySelector<HTMLElement>('[data-gl-close]')!;
  /** Previous, next. */
  const steps = [...dialog.querySelectorAll<HTMLElement>('[data-gl-step]')];
  const controls = [closer, ...steps];
  const still = reducedMotion.matches;
  const events = new AbortController();
  const options = { signal: events.signal };
  const { random } = gsap.utils;
  const side = () => (Math.random() < 0.5 ? -1 : 1);
  let swap: gsap.core.Timeline | null = null;
  let intro: gsap.core.Timeline | null = null;

  const box: Lightbox = {
    current: 0,
    open(index) {
      if (dialog.open) return;
      box.current = index;
      settle();
      // The rest load now, so paging never waits.
      dialog.querySelectorAll('img').forEach((img) => (img.loading = 'eager'));
      dialog.showModal();
      lockScroll(true);
      if (still) return;
      gsap.fromTo(dialog, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      swap = throwIn(index, side());
      intro = controlsIn().delay(0.5);
    },
  };

  /** Only the current screen shown, and nothing left mid-flight or half-scrambled. */
  const settle = () => {
    figs.forEach((fig, i) => {
      fig.hidden = i !== box.current;
      gsap.set([fig, sheets[i], captions[i]], { clearProps: 'all' });
      captions[i].textContent = names[i];
    });
    gsap.set(desk, { clearProps: 'transform' });
  };

  /** Sheet `i` flies in from the `from` side (-1 left, 1 right), and its caption scrambles in. */
  const throwIn = (i: number, from: number) => {
    const spin = from * random(14, 28);
    captions[i].textContent = '';
    return (
      gsap
        .timeline()
        .fromTo(
          sheets[i],
          { xPercent: 125 * from, yPercent: random(-25, 25), rotation: spin, scale: 0.86 },
          { xPercent: 0, yPercent: 0, rotation: -spin * 0.15, scale: 1, duration: 0.6, ease: 'power4.out' },
          0,
        )
        // It lands hard: the desk jolts the way it was going, and the sheet wobbles still.
        .to(desk, { keyframes: { x: [-14 * from, 8 * from, -3 * from, 0] }, duration: 0.4, ease: 'none' }, 0.32)
        .to(sheets[i], { rotation: 0, duration: 1.1, ease: 'elastic.out(1.2, 0.3)' }, 0.6)
        .to(captions[i], { scrambleText: { text: names[i], chars: names[i].replace(/\s/g, ''), speed: 0.7 }, duration: 0.8, ease: 'none' }, 0.35)
    );
  };

  /** The arrows skid in from their own edges, spinning; the close button drops in on a spring. */
  const controlsIn = () => {
    // Their hover transitions would drag every frame of this out.
    gsap.set(controls, { transition: 'none' });
    return gsap
      .timeline({ onComplete: () => void gsap.set(controls, { clearProps: 'all' }) })
      .fromTo(
        steps,
        { x: (k) => (k ? 160 : -160), rotation: (k) => (k ? 400 : -400), opacity: 0 },
        { x: 0, rotation: 0, opacity: 1, duration: 0.9, ease: 'back.out(1.8)', stagger: 0.1 },
        0,
      )
      .fromTo(closer, { y: -120, rotation: -220, scale: 0.4, opacity: 0 }, { y: 0, rotation: 0, scale: 1, opacity: 1, duration: 1.2, ease: 'elastic.out(1, 0.4)' }, 0.15);
  };

  const show = (index: number, dir: number) => {
    box.current = (index + figs.length) % figs.length;
    const i = box.current;
    swap?.kill();
    if (still) {
      settle();
      return;
    }
    // The arrow's chevron punches the way you went.
    gsap.fromTo(steps[dir > 0 ? 1 : 0].firstElementChild, { x: 12 * dir }, { x: 0, duration: 0.7, ease: 'elastic.out(1, 0.35)' });
    // Whatever is showing (a swap cut short can leave two) is flung off the far side as the new
    // sheet lands over it.
    const out = figs.flatMap((fig, j) => (j !== i && !fig.hidden ? [j] : []));
    figs[i].hidden = false;
    figs.forEach((fig, j) => gsap.set(fig, { zIndex: j === i ? 2 : 1 }));
    swap = gsap.timeline({ onComplete: settle });
    for (const j of out) {
      swap
        .to(sheets[j], { xPercent: -125 * dir, yPercent: random(-30, 30), rotation: -dir * random(18, 40), scale: 0.86, duration: 0.55, ease: 'power3.in' }, 0)
        .to(captions[j], { opacity: 0, duration: 0.15 }, 0);
    }
    swap.add(throwIn(i, dir), 0.1);
  };

  let closing: gsap.core.Timeline | null = null;
  const close = () => {
    if (!dialog.open || closing) return;
    if (still) {
      dialog.close();
      return;
    }
    swap?.kill();
    intro?.kill();
    const i = box.current;
    const away = side();
    gsap.set(controls, { transition: 'none' });
    closing = gsap
      .timeline({
        onComplete: () => {
          closing = null;
          dialog.close();
        },
      })
      .to(controls, { scale: 0, rotation: (k) => (k % 2 ? 140 : -140), opacity: 0, duration: 0.3, ease: 'back.in(2.5)', stagger: 0.04 }, 0)
      .to(captions[i], { opacity: 0, duration: 0.15 }, 0)
      .to(sheets[i], { xPercent: 70 * away, yPercent: 60, rotation: away * random(20, 35), scale: 0.8, opacity: 0, duration: 0.45, ease: 'power3.in' }, 0.05)
      .to(dialog, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.2);
  };

  // Real image links work without JS; only unmodified clicks open the lightbox.
  root.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const shot = (e.target as Element).closest<HTMLElement>('[data-gl-open]');
    if (!shot) return;
    e.preventDefault();
    box.open(Number(shot.dataset.glOpen));
  }, options);
  steps.forEach((btn) => {
    const dir = Number(btn.dataset.glStep);
    btn.addEventListener('click', () => show(box.current + dir, dir), options);
  });
  closer.addEventListener('click', close, options);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  }, options);
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(box.current - 1, -1);
    else if (e.key === 'ArrowRight') show(box.current + 1, 1);
  }, options);
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  }, options);
  dialog.addEventListener('close', () => {
    closing?.kill();
    closing = null;
    swap?.kill();
    intro?.kill();
    settle();
    gsap.set(controls, { clearProps: 'all' });
    lockScroll(false);
    root.dispatchEvent(new Event('gl:closed'));
  }, options);

  // A horizontal swipe pages on touch screens.
  let downX: number | null = null;
  dialog.addEventListener('pointerdown', (e) => (downX = e.pointerType === 'mouse' ? null : e.clientX), options);
  dialog.addEventListener('pointerup', (e) => {
    if (downX === null) return;
    const dx = e.clientX - downX;
    downX = null;
    if (Math.abs(dx) > 48) show(box.current - Math.sign(dx), -Math.sign(dx));
  }, options);
  onCleanup(() => {
    events.abort();
    closing?.kill();
    swap?.kill();
    intro?.kill();
    gsap.killTweensOf(dialog);
    gsap.killTweensOf(dialog.querySelectorAll('*'));
    if (dialog.open) {
      dialog.close();
      lockScroll(false);
    }
  });

  return box;
}
