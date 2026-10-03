import { gsap, reducedMotion } from './gsap';

/** Reveal the next zone from its button, without duplicating the page or its WebGL context. */
export async function transitionZone(button: HTMLElement, white: boolean, update: () => void): Promise<void> {
  if (reducedMotion.matches) {
    update();
    return;
  }

  const root = document.documentElement;
  const rect = button.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 100;
  root.style.setProperty('--zone-origin-x', `${x}px`);
  root.style.setProperty('--zone-origin-y', `${y}px`);
  root.style.setProperty('--zone-radius-end', `${radius}px`);
  root.dataset.zoneTransition = '';

  try {
    if (typeof document.startViewTransition === 'function' && CSS.supports('mask-composite', 'intersect') && 'registerProperty' in CSS) {
      const transition = document.startViewTransition(update);
      try {
        await transition.ready;
      } catch {
        // A hidden document can skip capture; its palette update still has to finish.
        await transition.updateCallbackDone;
      }
      await transition.finished;
    } else {
      // Older browsers get a paper/ink bloom, then uncover the updated live page.
      const veil = document.createElement('div');
      veil.className = 'zone-transition-veil';
      veil.dataset.target = white ? 'white' : 'black';
      veil.setAttribute('aria-hidden', 'true');
      Object.assign(veil.style, {
        width: `${radius * 2}px`,
        height: `${radius * 2}px`,
        left: `${x - radius}px`,
        top: `${y - radius}px`,
      });
      gsap.set(veil, { scale: 0 });
      document.body.append(veil);
      try {
        await gsap.to(veil, { scale: 1, duration: 0.8, ease: 'power3.inOut' });
        update();
        await gsap.to(veil, { opacity: 0, duration: 0.35, ease: 'power2.out' });
      } finally {
        gsap.killTweensOf(veil);
        veil.remove();
      }
    }
  } finally {
    delete root.dataset.zoneTransition;
    root.style.removeProperty('--zone-origin-x');
    root.style.removeProperty('--zone-origin-y');
    root.style.removeProperty('--zone-radius-end');
  }
}
