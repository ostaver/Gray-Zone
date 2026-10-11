import { onCleanup } from '../../lib/lifecycle';

let started = false;

/**
 * The border sweeps spin forever; a running CSS animation keeps the compositor producing frames
 * even when nothing else on the page moves. Buttons out of view (or in a menu parked off screen)
 * get `data-offscreen`, which pauses their sweeps.
 */
export function initCoolButtons(): void {
  if (started) return;
  started = true;
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) entry.target.toggleAttribute('data-offscreen', !entry.isIntersecting);
  });
  document.querySelectorAll('.cool-btn').forEach((button) => observer.observe(button));
  onCleanup(() => observer.disconnect());
}
