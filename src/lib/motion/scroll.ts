import Lenis from 'lenis';
import { gsap, ScrollTrigger, reducedMotion } from './gsap';

let lenis: Lenis | null = null;

/** Lenis driven by gsap.ticker so ScrollTrigger, WebGL and smooth scroll share one clock. */
export function initScroll(): Lenis | null {
  if (lenis || reducedMotion.matches) return lenis;
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.4,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

/** Freeze page scroll (preloader, modals). Works with or without Lenis. */
export function lockScroll(locked: boolean): void {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}

export function scrollToTarget(target: string | HTMLElement): void {
  if (lenis) lenis.scrollTo(target, { duration: 1.6 });
  else (typeof target === 'string' ? document.querySelector(target) : target)?.scrollIntoView();
}
