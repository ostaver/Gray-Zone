import Lenis from 'lenis';
import { gsap, ScrollTrigger, reducedMotion } from './gsap';

let lenis: Lenis | null = null;
/** Active scroll locks (preloader, modal); scroll is frozen while any is held. */
let locks = 0;

/** Lenis driven by gsap.ticker so ScrollTrigger, WebGL and smooth scroll share one clock. */
export function initScroll(): Lenis | null {
  if (lenis || reducedMotion.matches) return lenis;
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.4,
  });
  // A lock taken before Lenis existed (the preloader runs first) must hold it too.
  if (locks > 0) lenis.stop();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/**
 * Take (`true`) or release (`false`) a scroll lock; every take needs exactly one release.
 * Page scroll stays frozen while any lock is held. Works with or without Lenis.
 */
export function lockScroll(locked: boolean): void {
  locks = Math.max(0, locks + (locked ? 1 : -1));
  const frozen = locks > 0;
  if (lenis) {
    if (frozen) lenis.stop();
    else lenis.start();
  }
  document.documentElement.style.overflow = frozen ? 'hidden' : '';
}

export function scrollToTarget(target: string | HTMLElement): void {
  if (lenis) lenis.scrollTo(target, { duration: 1.6 });
  else (typeof target === 'string' ? document.querySelector(target) : target)?.scrollIntoView();
}
