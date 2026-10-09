import { gsap, ScrollTrigger, reducedMotion } from '../../lib/motion/gsap';
import { print } from '../../lib/motion/reveal';
import { flapBoard } from '../../lib/motion/flap';

/**
 * Contact: the title and text print in; each channel rules itself in, its label scrambles on and
 * its value rises out of a slot. Hovering a value rolls red ink across it (CSS) and scrambles it.
 * The address can be copied, and a split-flap "copied" board clatters out over the button when it is.
 */
export function initContact(root: HTMLElement): void {
  initCopy(root);
  print([...root.querySelectorAll('[data-ct-print]')]);
  if (reducedMotion.matches) return;

  const channels = [...root.querySelectorAll<HTMLElement>('[data-ct-channel]')];
  const parts = (c: HTMLElement) => [...c.querySelectorAll<HTMLElement>('[data-ct-part]')];
  const label = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ct-label]');
  const labels = new Map(channels.map((c) => [c, label(c)?.textContent ?? '']));

  gsap.set(channels.map((c) => c.querySelector('[data-ct-rule]')), { scaleX: 0 });
  gsap.set(channels.flatMap(parts), { yPercent: 110 });
  for (const c of channels) {
    const l = label(c);
    if (l) l.textContent = '';
  }

  ScrollTrigger.batch(channels, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => {
      const els = batch as HTMLElement[];
      gsap.to(
        els.map((c) => c.querySelector('[data-ct-rule]')),
        { scaleX: 1, duration: 1.2, ease: 'expo.inOut', stagger: 0.1 },
      );
      els.forEach((c, i) => {
        gsap.to(parts(c), { yPercent: 0, duration: 1.1, ease: 'tear', stagger: 0.08, delay: 0.2 + i * 0.1 });
        const l = label(c);
        const text = labels.get(c) ?? '';
        if (l) gsap.to(l, { scrambleText: { text, chars: text.replace(/\s/g, ''), speed: 0.6 }, duration: 0.8, ease: 'none', delay: 0.3 + i * 0.1 });
      });
    },
  });

  // On hover the value scrambles back into itself, part by part.
  if (!window.matchMedia('(hover: hover)').matches) return;
  for (const link of root.querySelectorAll<HTMLElement>('[data-ct-link]')) {
    const ps = [...link.querySelectorAll<HTMLElement>('[data-ct-part]')];
    const texts = ps.map((p) => p.textContent ?? '');
    link.addEventListener('mouseenter', () => {
      ps.forEach((p, k) =>
        gsap.to(p, { scrambleText: { text: texts[k], chars: 'lowerCase', speed: 0.8, revealDelay: 0.1 }, duration: 0.6, ease: 'none', delay: k * 0.08, overwrite: 'auto' }),
      );
    });
  }
}

function initCopy(root: HTMLElement): void {
  const button = root.querySelector<HTMLButtonElement>('[data-ct-copy]');
  const stamp = root.querySelector<HTMLElement>('[data-ct-stamp]');
  const face = stamp?.querySelector<HTMLElement>('[data-flap]');
  const status = root.querySelector<HTMLElement>('[data-ct-status]');
  if (!button || !stamp || !face || !status) return;
  // Without the clipboard API (or off https) the mailto link is all there is.
  if (!navigator.clipboard) {
    button.hidden = true;
    return;
  }
  button.hidden = false;

  const board = flapBoard(face);
  board.blank();
  const clear = () => {
    delete stamp.dataset.on;
    gsap.set(stamp, { clearProps: 'opacity' });
    board.blank();
  };
  let hide: gsap.core.Tween | null = null;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.ctCopy ?? '');
    } catch {
      return;
    }
    // Re-announced on every copy: the live region only speaks when its text changes.
    status.textContent = '';
    requestAnimationFrame(() => (status.textContent = status.dataset.copied ?? ''));

    hide?.kill();
    gsap.set(stamp, { clearProps: 'opacity' });
    stamp.dataset.on = '';
    if (reducedMotion.matches) {
      board.settle();
      hide = gsap.delayedCall(1.8, clear);
      return;
    }
    const flip = board.flip();
    hide = gsap.to(stamp, { opacity: 0, duration: 0.4, delay: flip.duration() + 1.4, ease: 'power2.out', onComplete: clear });
  });
}
