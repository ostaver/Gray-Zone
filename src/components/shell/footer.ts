import { gsap, ScrollTrigger, reducedMotion } from '../../lib/motion/gsap';
import { onCleanup } from '../../lib/lifecycle';

/**
 * The footer: links out, then the name at the foot of the page, whose letters rise out of the
 * floor one after another as the last of the page scrolls in. (No back-to-top button: see AGENTS.md.)
 */
export function initFooter(root: HTMLElement): void {
  const mark = root.querySelector<HTMLElement>('[data-ft-mark]')!;
  const letters = [...mark.querySelectorAll<HTMLElement>('[data-ft-letter]')];
  // The language link keeps the reader's place, like the nav's.
  const lang = root.querySelector<HTMLAnchorElement>('[data-ft-lang]');
  if (lang) {
    const sync = () => { lang.hash = location.hash; };
    sync();
    window.addEventListener('hashchange', sync);
    onCleanup(() => window.removeEventListener('hashchange', sync));
  }
  fit(mark);
  if (reducedMotion.matches) return;

  gsap.fromTo(
    letters,
    { yPercent: 105 },
    {
      yPercent: 0,
      ease: 'none',
      // Spread over the scroll, the later letters bunched towards the end.
      stagger: { each: 0.08, ease: 'power1.in' },
      // Ends at the very bottom of the page, where the whole name is in view.
      scrollTrigger: { trigger: mark, start: 'top bottom', end: () => ScrollTrigger.maxScroll(window), scrub: 0.6 },
    },
  );
}

/** Sizes the name so its letters, set solid, span the mark's width exactly. */
function fit(mark: HTMLElement): void {
  const children = [...mark.children] as HTMLElement[];
  const size = () => {
    const natural = children.reduce((w, el) => w + el.getBoundingClientRect().width, 0);
    if (!natural) return;
    const px = parseFloat(getComputedStyle(mark).fontSize);
    const next = (px * mark.clientWidth) / natural;
    if (Math.abs(next - px) < 0.5) return;
    mark.style.fontSize = `${next}px`;
    // The page's foot moved: the triggers measured against it need to know.
    ScrollTrigger.refresh();
  };
  // Measured once the display face is in: the fallback's letters are a different width.
  void document.fonts.ready.then(size);
  new ResizeObserver(size).observe(mark);
}
