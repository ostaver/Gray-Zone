import Lenis from 'lenis';
import { gsap, ScrollTrigger, reducedMotion } from './gsap';
import { appReady, assetsSettled, onCleanup } from '../lifecycle';

let lenis: Lenis | null = null;
/** Active scroll locks (preloader, modal); scroll is frozen while any is held. */
let locks = 0;
let linksInitialized = false;

function initSectionLinks(): void {
  if (linksInitialized) return;
  linksInitialized = true;
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const destination = () => {
    try { return document.getElementById(decodeURIComponent(location.hash.slice(1))); }
    catch { return null; }
  };
  let frame = 0;
  const restore = () => {
    if (controller.signal.aborted) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const target = destination();
      if (target) scrollToTarget(target, 0);
    });
  };
  window.addEventListener('hashchange', () => void appReady.then(restore), options);
  window.addEventListener('popstate', () => void appReady.then(restore), options);
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
    let target: HTMLElement | null;
    try { target = document.getElementById(decodeURIComponent(url.hash.slice(1))); }
    catch { return; }
    if (!target) return;
    event.preventDefault();
    if (location.hash !== url.hash) {
      history.pushState(null, '', url.hash);
      // pushState does not emit hashchange; keep language links ready for modified clicks too.
      window.dispatchEvent(new Event('grayzone:section'));
    }
    scrollToTarget(target, reducedMotion.matches ? 0 : 1.2);
    if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }, options);
  void appReady.then(async () => {
    await assetsSettled();
    if (controller.signal.aborted) return;
    ScrollTrigger.refresh();
    restore();
  });
  onCleanup(() => {
    controller.abort();
    cancelAnimationFrame(frame);
  });
}

/** Lenis driven by gsap.ticker so ScrollTrigger, WebGL and smooth scroll share one clock. */
export function initScroll(): Lenis | null {
  initSectionLinks();
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
  const tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  onCleanup(() => {
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
  });
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

/** Smooth-scroll to an element, a selector, or a page offset in px. */
export function scrollToTarget(target: string | HTMLElement | number, duration = 1.6): void {
  if (lenis) lenis.scrollTo(target, { duration, immediate: duration === 0 });
  else if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'instant' });
  else (typeof target === 'string' ? document.querySelector(target) : target)?.scrollIntoView({ behavior: 'instant' });
}
