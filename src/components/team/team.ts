import { gsap, ScrollTrigger, reducedMotion } from '../../lib/motion/gsap';
import { print } from '../../lib/motion/reveal';

/**
 * The team: a photo and a roster of files. The title, hint and photo print in as they scroll
 * into view; the photo drifts against the scroll while it holds still beside the roster. Each
 * roster line rules itself in and its row is slung in from alternating sides. Opening a file
 * unrolls it: the bio rises line by line, the tags float up one after another and the links
 * slide in; one file is open at a time. The files are native <details>, so without JS (or with
 * reduced motion) they simply open and close.
 */
export function initTeam(root: HTMLElement): void {
  print([...root.querySelectorAll('[data-tm-print]')]);
  if (reducedMotion.matches) return;

  const img = root.querySelector<HTMLElement>('[data-tm-img]')!;
  gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true } });

  initRoster(root);
  initFiles(root);
}

function initRoster(root: HTMLElement): void {
  const members = [...root.querySelectorAll<HTMLElement>('[data-tm-member], .tm__member--end')];
  const rule = (m: HTMLElement) => m.querySelector<HTMLElement>('[data-tm-rule]')!;
  const row = (m: HTMLElement) => m.querySelector<HTMLElement>('summary');
  const side = (m: HTMLElement) => (members.indexOf(m) % 2 ? 1 : -1);
  gsap.set(members.map(rule), { scaleX: 0 });
  for (const m of members) {
    const r = row(m);
    if (r) gsap.set(r, { opacity: 0, x: 70 * side(m), skewX: -14 * side(m) });
  }
  ScrollTrigger.batch(members, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => {
      const els = batch as HTMLElement[];
      gsap.to(els.map(rule), { scaleX: 1, duration: 1.2, ease: 'expo.inOut', stagger: 0.08 });
      const rows = els.map(row).filter((r): r is HTMLElement => r !== null);
      // The closing rule enters on its own, with no row to bring in.
      if (rows.length) gsap.to(rows, { opacity: 1, x: 0, skewX: 0, duration: 1.1, ease: 'tear', stagger: 0.08, delay: 0.15, clearProps: 'transform,opacity' });
    },
  });
}

function initFiles(root: HTMLElement): void {
  const all = [...root.querySelectorAll<HTMLDetailsElement>('[data-tm-details]')];
  // The native one-open-at-a-time group would snap the other file shut; we close it ourselves.
  all.forEach((d) => d.removeAttribute('name'));
  const timelines = new Map<HTMLDetailsElement, gsap.core.Timeline>();
  const closing = new Set<HTMLDetailsElement>();

  const parts = (d: HTMLDetailsElement) => ({
    file: d.querySelector<HTMLElement>('[data-tm-file]')!,
    role: d.querySelector<HTMLElement>('[data-tm-role]')!,
    paras: [...d.querySelectorAll<HTMLElement>('[data-tm-para]')],
    tags: [...d.querySelectorAll<HTMLElement>('[data-tm-tag]')],
    links: [...d.querySelectorAll<HTMLElement>('[data-tm-link]')],
  });
  const roles = new Map(all.map((d) => [d, parts(d).role.textContent ?? '']));

  const open = (d: HTMLDetailsElement) => {
    for (const other of all) if (other !== d && other.open && !closing.has(other)) close(other);
    timelines.get(d)?.kill();
    closing.delete(d);
    d.open = true;
    const { file, role, paras, tags, links } = parts(d);
    const text = roles.get(d) ?? '';
    const tl = gsap.timeline();
    timelines.set(d, tl);
    tl.fromTo(file, { height: 0 }, { height: 'auto', duration: 0.9, ease: 'expo.out' }, 0)
      .to(role, { scrambleText: { text, chars: text.replace(/\s/g, ''), speed: 0.6 }, duration: 0.7, ease: 'none' }, 0)
      .fromTo(paras, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.07 }, 0.1);
    // Each tag floats up into place, one after the other.
    tl.fromTo(tags, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.07, ease: 'power3.out' }, 0.3);
    tl.fromTo(links, { x: -16, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, stagger: 0.05 }, 0.4);
  };

  const close = (d: HTMLDetailsElement) => {
    timelines.get(d)?.kill();
    closing.add(d);
    const { file, role } = parts(d);
    role.textContent = roles.get(d) ?? '';
    const tl = gsap.timeline({
      onComplete: () => {
        closing.delete(d);
        d.open = false;
        gsap.set(file, { clearProps: 'height' });
      },
    });
    timelines.set(d, tl);
    tl.fromTo(file, { height: file.offsetHeight }, { height: 0, duration: 0.55, ease: 'expo.inOut' });
  };

  for (const d of all) {
    d.querySelector('summary')!.addEventListener('click', (e) => {
      e.preventDefault();
      if (d.open && !closing.has(d)) close(d);
      else open(d);
    });
  }
}
