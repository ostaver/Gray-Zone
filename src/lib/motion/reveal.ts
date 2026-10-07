import { gsap, ScrollTrigger, reducedMotion } from './gsap';

/**
 * Section copy printed onto the page as it scrolls into view: a front sweeps across each block,
 * a halftone dot fringe ahead of it and solid ink behind (the mask lives on `[data-printing]` in
 * global.css). Blocks entering together print one after another. Start states are set here,
 * never in CSS: without JS (or with reduced motion) the copy is simply there.
 */
export function print(targets: Element[], { stagger = 0.14 }: { stagger?: number } = {}): void {
  if (reducedMotion.matches || targets.length === 0) return;
  gsap.set(targets, { '--print': '-12%', attr: { 'data-printing': '' } });
  ScrollTrigger.batch(targets, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      void gsap.to(batch, {
        '--print': '130%',
        duration: 1.7,
        ease: 'power2.inOut',
        stagger,
        // Off the mask once printed: a static block shouldn't pay for compositing it.
        onComplete() {
          for (const el of this.targets() as HTMLElement[]) {
            el.removeAttribute('data-printing');
            el.style.removeProperty('--print');
          }
        },
      }),
  });
}
