import { gsap, ScrollTrigger, SplitText, coarsePointer, reducedMotion } from '../../lib/motion/gsap';
import { magnetic } from '../../lib/motion/magnetic';
import { appReady } from '../../lib/lifecycle';
import { getStage } from '../../lib/gl/stage';
import { createSeamHalftone, type SeamHalftoneState } from '../../lib/gl/views/seamHalftone';
import { detectPlatform } from '../../lib/platform';
import { SeamModel } from './seam';

export function initHero(root: HTMLElement): void {
  const pin = root.querySelector<HTMLElement>('[data-hero-pin]')!;
  const glEl = root.querySelector<HTMLElement>('[data-hero-gl]')!;
  const clipped = [...root.querySelectorAll<HTMLElement>('[data-seam-clip]')];
  const sideHonest = root.querySelector<HTMLElement>('[data-side="honest"]')!;
  const sideGray = root.querySelector<HTMLElement>('[data-side="gray"]')!;
  const still = reducedMotion.matches;
  // Seam-driven UI (path labels) is only meaningful once this script is running.
  root.dataset.live = '';

  // ── Seam + shared state ────────────────────────────────────
  // Starts centred: the preloader's logo zooms through its own tear, which hands over here.
  const seam = new SeamModel();
  const state: SeamHalftoneState = {
    seam: seam.xs,
    mouse: { x: -1e4, y: -1e4 },
    mouseForce: 0,
    reveal: still ? 1 : 0,
    progress: 0,
    still,
  };
  let target = seam.split;
  let pointer: { x: number; y: number } | null = null;
  let introDone = still;

  // ── WebGL field (or DOM fallback when the stage is unavailable) ──
  const stage = getStage();
  if (stage) {
    stage.add(
      createSeamHalftone(stage, {
        el: glEl,
        cell: coarsePointer.matches ? 13 : 16,
        fps: coarsePointer.matches ? 30 : 60,
        state,
      }),
    );
  }

  // ── Geometry for DOM clip-paths ────────────────────────────
  // Read every frame: the title is scroll-transformed, so boxes move without resizing.
  // For translate/scale transforms the bounding rect maps local → hero space linearly.
  const title = root.querySelector<HTMLElement>('.hero__title')!;
  let heroW = 1;
  let heroH = 1;
  let titleTop = 0;
  const boxes = clipped.map(() => ({ left: 0, top: 0, width: 1, height: 1, sx: 1, sy: 1 }));
  const measure = () => {
    const pr = pin.getBoundingClientRect();
    heroW = pr.width;
    heroH = pr.height;
    titleTop = title.getBoundingClientRect().top - pr.top;
    clipped.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const b = boxes[i];
      b.width = el.offsetWidth || 1;
      b.height = el.offsetHeight || 1;
      b.left = r.left - pr.left;
      b.top = r.top - pr.top;
      b.sx = r.width / b.width || 1;
      b.sy = r.height / b.height || 1;
    });
  };

  // ── Pointer ────────────────────────────────────────────────
  let lastMove = { x: 0, y: 0, t: 0 };
  let speed = 0;
  pin.addEventListener('pointermove', (e) => {
    const r = pin.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const now = performance.now();
    const dt = Math.max(1, now - lastMove.t);
    speed = Math.max(speed, Math.hypot(x - lastMove.x, y - lastMove.y) / dt);
    lastMove = { x, y, t: now };
    state.mouse.x = x;
    state.mouse.y = y;
    pointer = { x: x / r.width, y: y / r.height };
  });
  pin.addEventListener('pointerleave', () => {
    pointer = null;
    state.mouse.x = state.mouse.y = -1e4;
  });

  // ── Per-frame update (only while the hero is on screen) ────
  let inView = true;
  new IntersectionObserver(([entry]) => (inView = entry.isIntersecting)).observe(root);
  let prev = 0;
  gsap.ticker.add((time) => {
    const dt = prev ? time - prev : 1 / 60;
    prev = time;
    if (!inView) return;
    // Before the intro releases it, the seam holds its starting line.
    if (introDone) {
      if (still) target = 0.5;
      else if (pointer) target = 0.1 + pointer.x * 0.8;
      else target = 0.5 + Math.sin(time * 0.35) * 0.07 + Math.sin(time * 0.13) * 0.04;
    }
    speed *= 0.9;
    state.mouseForce += (Math.min(1, speed / 2.2) - state.mouseForce) * 0.12;
    seam.update({ time, dt, target, pointer: still ? null : pointer, progress: state.progress, still });

    // Reads first, then writes: one layout per frame.
    measure();
    const honestLabelW = sideHonest.offsetWidth;
    for (let i = 0; i < clipped.length; i++) {
      const side = clipped[i].dataset.seamClip === 'left' ? 'left' : 'right';
      clipped[i].style.clipPath = seam.clipPolygon(side, boxes[i], heroW, heroH);
    }

    // Path labels ride the seam just above the headline.
    const labelY = Math.max(0, titleTop - 26);
    const sx = seam.at(labelY / heroH) * heroW;
    sideHonest.style.transform = `translate3d(${sx - honestLabelW - 18}px, ${labelY}px, 0) translateY(-50%)`;
    sideGray.style.transform = `translate3d(${sx + 18}px, ${labelY}px, 0) translateY(-50%)`;
  });

  // ── Scroll: sweep into the gray zone ───────────────────────
  const fades = root.querySelectorAll<HTMLElement>('[data-hero-fade]');
  ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      state.progress = self.progress;
    },
  });
  if (!still) {
    gsap
      .timeline({ scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.6 } })
      .to(title, { yPercent: -18, scale: 0.92, ease: 'none' }, 0)
      .to(title, { opacity: 0, ease: 'power1.in' }, 0.35)
      .to([...root.querySelectorAll('.hero__sides, .hero__bottom')], { opacity: 0, y: -40, ease: 'power1.in', duration: 0.4 }, 0);
  }

  // ── CTAs ───────────────────────────────────────────────────
  const osLabel = root.querySelector<HTMLElement>('[data-os-label]');
  const platform = detectPlatform();
  if (osLabel && platform) osLabel.textContent = `· ${platform === 'mac' ? 'macOS' : 'Windows'}`;
  root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => magnetic(el, 0.3));

  // ── Intro ──────────────────────────────────────────────────
  if (still) return;
  const splits = [...root.querySelectorAll<HTMLElement>('.hero__layer')].map((layer) => SplitText.create(layer.querySelectorAll('.hero__line'), { type: 'chars' }));
  const chars = splits.flatMap((s) => s.chars);
  gsap.set(chars, { yPercent: 115 });
  gsap.set(fades, { opacity: 0, y: 24 });
  gsap.set([sideHonest, sideGray], { opacity: 0 });

  void appReady.then(() => {
    // Same stagger order for both layers so the halves stay welded across the tear.
    const perLayer = splits.map((s) => s.chars);
    const tl = gsap.timeline();
    tl.to(state, { reveal: 1, duration: 2.4, ease: 'power2.out' }, 0);
    perLayer.forEach((layerChars) => tl.to(layerChars, { yPercent: 0, duration: 1.5, stagger: 0.045 }, 0.15));
    tl.add(() => {
      introDone = true;
      target = 0.5;
    }, 0.1);
    tl.to(fades, { opacity: 1, y: 0, duration: 1.2, stagger: 0.08 }, 0.55);
    tl.to([sideHonest, sideGray], { opacity: 1, duration: 1 }, 1.1);
  });
}
