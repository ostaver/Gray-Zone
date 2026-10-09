import { gsap, ScrollTrigger, reducedMotion } from '../../lib/motion/gsap';
import { onCleanup } from '../../lib/lifecycle';
import { onZoneChange } from '../../lib/zone';
import type { GlowLogo } from '../../lib/glow-logo';

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
    window.addEventListener('grayzone:section', sync);
    onCleanup(() => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('grayzone:section', sync);
    });
  }
  const sig = root.querySelector<HTMLAnchorElement>('.ft__sig');
  const logo = sig?.querySelector<GlowLogo>('glow-logo');
  if (sig && logo) {
    // The glow ramp follows the zone through the root, which the renderer can't see: tell it.
    onCleanup(onZoneChange(() => logo.refresh()));
    flare(sig, logo);
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
  const observer = new ResizeObserver(size);
  observer.observe(mark);
  onCleanup(() => observer.disconnect());
}

/** How stiff the signature's spring is going in and coming back (1/s²); critically damped either way. */
const FLARE_IN = 110;
const FLARE_OUT = 45;

/**
 * The signature's hover: the logo swells a touch and its fire burns hotter, higher and quicker
 * while the pointer or keyboard focus is on it, then settles back. One spring drives the swell
 * (`--flare`, read by the CSS) and the fire together, so they never drift apart, and a hover that
 * turns around midway keeps its momentum instead of jumping. Only the renderer's live numeric
 * properties move (never `spread`, which re-lays-out the canvas); the resting values are read off
 * the element, not repeated here. The spring runs on gsap's ticker only while it moves.
 */
function flare(sig: HTMLElement, logo: GlowLogo): void {
  if (reducedMotion.matches) return;
  const rest = { intensity: logo.intensity, lift: logo.lift, speed: logo.speed };
  // Hotter rather than wider: past ~1.4x the halo stops reading as fire and turns into a blob.
  const peak = { intensity: rest.intensity * 1.35, lift: rest.lift * 1.6, speed: rest.speed * 1.5 };
  let k = 0;
  let v = 0;
  let target = 0;
  let running = false;
  const apply = () => {
    sig.style.setProperty('--flare', k.toFixed(4));
    logo.intensity = rest.intensity + (peak.intensity - rest.intensity) * k;
    logo.lift = rest.lift + (peak.lift - rest.lift) * k;
    logo.speed = rest.speed + (peak.speed - rest.speed) * k;
  };
  const tick = (_time: number, deltaMs: number) => {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    const stiffness = target ? FLARE_IN : FLARE_OUT;
    v += (stiffness * (target - k) - 2 * Math.sqrt(stiffness) * v) * dt;
    k += v * dt;
    if (Math.abs(target - k) < 0.001 && Math.abs(v) < 0.01) {
      k = target;
      v = 0;
      stop();
    }
    apply();
  };
  const start = () => {
    if (running) return;
    running = true;
    gsap.ticker.add(tick);
  };
  const stop = () => {
    running = false;
    gsap.ticker.remove(tick);
  };
  const on = () => { target = 1; start(); };
  const off = () => { target = 0; start(); };
  const focusOn = () => { if (sig.matches(':focus-visible')) on(); };
  const blurOff = () => { if (!sig.matches(':hover')) off(); };
  sig.addEventListener('pointerenter', on);
  sig.addEventListener('pointerleave', off);
  sig.addEventListener('focus', focusOn);
  sig.addEventListener('blur', blurOff);
  onCleanup(() => {
    stop();
    sig.removeEventListener('pointerenter', on);
    sig.removeEventListener('pointerleave', off);
    sig.removeEventListener('focus', focusOn);
    sig.removeEventListener('blur', blurOff);
    k = v = target = 0;
    apply();
  });
}
