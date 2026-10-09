import { gsap, ScrollTrigger, reducedMotion } from '../../lib/motion/gsap';
import { print } from '../../lib/motion/reveal';
import { detectPlatform } from '../../lib/platform';

/**
 * The closing call to play: a pass into the gray zone. The title prints in; the ticket feeds out
 * of its slot in steps as the section scrolls in (like a ticket machine) and drops a little once
 * it's out. Each platform is a stub on the ticket: hovering peels it off its perforation, and
 * clicking (which downloads) tears it off and lets it fall, then a fresh one prints back in.
 * The reader's own platform, if we can tell, comes first and is marked.
 */
export function initPlay(root: HTMLElement): void {
  const stubs = [...root.querySelectorAll<HTMLAnchorElement>('[data-pl-stub]')];
  const platform = detectPlatform();
  const mine = stubs.find((stub) => stub.dataset.platform === platform);
  if (mine) {
    mine.dataset.detected = '';
    mine.querySelector<HTMLElement>('[data-pl-badge]')!.hidden = false;
    mine.parentElement!.prepend(mine);
  }

  print([...root.querySelectorAll('[data-pl-print]')]);
  if (reducedMotion.matches) return;

  const ticket = root.querySelector<HTMLElement>('[data-pl-ticket]')!;
  const feed = root.querySelector<HTMLElement>('[data-pl-feed]')!;

  // Fed out in steps, as a printer would, scrubbed by the scroll.
  gsap.fromTo(ticket, { yPercent: -101 }, { yPercent: 0, ease: 'steps(18)', scrollTrigger: { trigger: feed, start: 'top 80%', end: 'top 20%', scrub: true } });
  // Once it's all the way out it drops onto its corner; scrolled back, it hangs straight again.
  let dropped = false;
  ScrollTrigger.create({
    trigger: feed,
    start: 'top 20%',
    onEnter: () => {
      if (dropped) return;
      dropped = true;
      gsap.to(ticket, { rotation: -1.6, y: 8, duration: 1.2, ease: 'elastic.out(1, 0.35)' });
    },
    onLeaveBack: () => {
      dropped = false;
      gsap.to(ticket, { rotation: 0, y: 0, duration: 0.4, ease: 'power2.out' });
    },
  });

  const wide = window.matchMedia('(min-width: 768px)');
  for (const stub of stubs) {
    stub.addEventListener('click', () => {
      if (stub.dataset.torn !== undefined) return;
      stub.dataset.torn = '';
      // Off its perforation (sideways on wide tickets, down on narrow ones), then it falls.
      const dir = wide.matches ? 1 : stubs.indexOf(stub) ? 1 : -1;
      gsap.set(stub, { transition: 'none', pointerEvents: 'none' });
      gsap
        .timeline({
          onComplete: () => {
            gsap.set(stub, { clearProps: 'all' });
            delete stub.dataset.torn;
          },
        })
        .to(stub, { rotation: dir * gsap.utils.random(14, 22), x: dir * 10, duration: 0.18, ease: 'power2.out' })
        // The ticket jolts as the stub rips free.
        .to(ticket, { keyframes: { x: [0, -6 * dir, 3 * dir, 0] }, duration: 0.35, ease: 'none' }, 0.12)
        .to(stub, { y: innerHeight * 0.7, x: dir * gsap.utils.random(60, 140), rotation: dir * gsap.utils.random(70, 140), opacity: 0, duration: 1, ease: 'power2.in' }, 0.18)
        // A fresh stub prints back in where it was.
        .set(stub, { x: 0, y: 0, rotation: 0 }, 1.6)
        .fromTo(stub, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' }, 1.6);
    });
  }
}
