import { gsap, ScrollTrigger, coarsePointer, reducedMotion } from '../../lib/motion/gsap';
import { print } from '../../lib/motion/reveal';
import { getStage } from '../../lib/gl/stage';
import { createLogoOrb, type LogoOrbState } from '../../lib/gl/views/logoOrb';
import { initTrade } from './trade';

export function initAbout(root: HTMLElement): void {
  const still = reducedMotion.matches;
  initOrb(root.querySelector<HTMLElement>('[data-orb]')!, still);
  initTrade(root.querySelector<HTMLElement>('[data-trade]')!);
  if (still) return;

  // The statement is read across the tear: each word's solid copy rips across its gray one as
  // the reader reaches it, one after another, and back again on the way up.
  const statement = root.querySelector<HTMLElement>('[data-ab-statement]')!;
  const tl = gsap.timeline({ scrollTrigger: { trigger: statement, start: 'top 78%', end: 'bottom 40%', scrub: 0.6 } });
  statement.querySelectorAll<HTMLElement>('.ab__w-lit').forEach((lit, i) => {
    tl.fromTo(lit, { xPercent: -101 }, { xPercent: 0, ease: 'none', duration: 1 }, i * 0.4).fromTo(lit.firstElementChild, { xPercent: 101 }, { xPercent: 0, ease: 'none', duration: 1 }, i * 0.4);
  });
  print([...root.querySelectorAll('[data-ab-print]')]);
}

/** The logo, printed in dots by the page's WebGL stage, turning as it scrolls by. */
function initOrb(orb: HTMLElement, still: boolean): void {
  const stage = getStage();
  if (!stage) return;
  const state: LogoOrbState = { angle: 0, mouse: { x: -1e4, y: -1e4 }, reveal: still ? 1 : 0, still };
  stage.add(
    createLogoOrb(stage, {
      el: orb.querySelector<HTMLElement>('[data-orb-gl]')!,
      cell: coarsePointer.matches ? 8 : 9,
      radius: 0.8,
      fps: coarsePointer.matches ? 30 : 60,
      lines: JSON.parse(orb.dataset.lines ?? '[]') as string[],
      state,
    }),
  );
  if (still) return;

  orb.addEventListener('pointermove', (e) => {
    const r = orb.getBoundingClientRect();
    state.mouse.x = e.clientX - r.left;
    state.mouse.y = e.clientY - r.top;
  });
  orb.addEventListener('pointerleave', () => (state.mouse.x = state.mouse.y = -1e4));

  ScrollTrigger.create({
    trigger: orb,
    start: 'top 82%',
    once: true,
    onEnter: () => void gsap.to(state, { reveal: 1, duration: 2.4, ease: 'power2.out' }),
  });

  // From a quarter turn back to past upright while it passes, with a slow sway on top. The
  // orb is sticky on desktop, so its column (the parent) gives the scroll range.
  let turn = -0.45;
  ScrollTrigger.create({
    trigger: orb.parentElement,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => (turn = -0.45 + self.progress * 0.9),
  });
  let inView = false;
  new IntersectionObserver(([entry]) => (inView = entry.isIntersecting)).observe(orb);
  gsap.ticker.add((time) => {
    if (!inView) return;
    state.angle += (turn + Math.sin(time * 0.5) * 0.05 - state.angle) * 0.08;
  });
}
