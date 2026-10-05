import { gsap, reducedMotion } from '../../lib/motion/gsap';
import { lockScroll, scrollToTarget } from '../../lib/motion/scroll';
import { magnetic } from '../../lib/motion/magnetic';
import { appReady } from '../../lib/lifecycle';
import { currentZone, onZoneBusy, onZoneChange, setZone, type Zone } from '../../lib/zone';

/** The reader is "in" a section once its top passes this fraction of the viewport. */
const READING_LINE = 0.4;

export function initNav(nav: HTMLElement): void {
  const still = reducedMotion.matches;
  const head = nav.querySelector<HTMLElement>('[data-nav-head]')!;
  const actions = nav.querySelector<HTMLElement>('[data-nav-actions]')!;
  const cta = nav.querySelector<HTMLElement>('[data-nav-cta]')!;
  const toggle = nav.querySelector<HTMLButtonElement>('[data-nav-toggle]')!;
  const main = document.getElementById('main');
  const hero = document.querySelector<HTMLElement>('[data-hero]');

  // ── Menu (compact layouts) ─────────────────────────────────
  const menu = nav.querySelector<HTMLElement>('[data-nav-menu]')!;
  const panel = menu.querySelector<HTMLElement>('[data-nav-panel]')!;
  const tear = menu.querySelector<SVGElement>('[data-menu-tear]')!;
  const words = [...menu.querySelectorAll<HTMLElement>('[data-menu-word]')];
  const marks = [...menu.querySelectorAll<HTMLElement>('[data-menu-idx]')];
  const foot = [...menu.querySelectorAll<HTMLElement>('[data-menu-foot] > *')];
  let menuOpen = false;
  let menuTl: gsap.core.Timeline | null = null;
  gsap.set(panel, { yPercent: -100 });

  const openMenu = () => {
    if (menuOpen) return;
    menuOpen = true;
    nav.dataset.menu = '';
    delete nav.dataset.hidden;
    toggle.setAttribute('aria-expanded', 'true');
    // Like a dialog: the page underneath is out of reach until the menu closes.
    main?.setAttribute('inert', '');
    lockScroll(true);
    menuTl?.kill();
    menuTl = gsap
      .timeline()
      .set(menu, { visibility: 'visible' })
      .to(panel, { yPercent: 0, duration: 1.05, ease: 'tear' }, 0)
      .fromTo(tear, { scaleY: 0 }, { scaleY: 1, duration: 1.4, ease: 'expo.inOut' }, 0.1)
      .fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.065 }, 0.3)
      .fromTo(marks, { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.065, ease: 'power2.out' }, 0.45)
      .fromTo(foot, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 0.5);
    if (still) menuTl.progress(1);
  };

  /** `restoreFocus`: hand focus back to the toggle if it was inside the menu. */
  const closeMenu = (restoreFocus: boolean) => {
    if (!menuOpen) return;
    menuOpen = false;
    delete nav.dataset.menu;
    toggle.setAttribute('aria-expanded', 'false');
    main?.removeAttribute('inert');
    lockScroll(false);
    if (restoreFocus && menu.contains(document.activeElement)) toggle.focus();
    menuTl?.kill();
    menuTl = gsap
      .timeline({ onComplete: () => void gsap.set(menu, { visibility: 'hidden' }) })
      .to(words, { yPercent: -110, duration: 0.5, stagger: 0.035, ease: 'power3.in' }, 0)
      .to([...marks, ...foot], { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0)
      .to(panel, { yPercent: -100, duration: 0.8, ease: 'expo.inOut' }, 0.15);
    if (still) menuTl.progress(1);
  };

  toggle.addEventListener('click', () => (menuOpen ? closeMenu(true) : openMenu()));
  document.addEventListener('keydown', (e) => {
    // An open dialog (download) owns Escape; it sits above the menu.
    if (e.key !== 'Escape' || !menuOpen || document.querySelector('dialog[open]')) return;
    closeMenu(true);
  });

  // ── In-page links ──────────────────────────────────────────
  nav.addEventListener('click', (e) => {
    // Modified clicks keep their native meaning (new tab/window).
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    const target = link && document.getElementById(link.hash.slice(1));
    if (!target) return;
    e.preventDefault();
    closeMenu(false);
    scrollToTarget(target);
    // Keyboard users carry on from the section they jumped to, not from the nav.
    if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
    target.focus({ preventScroll: true });
  });

  // ── Zone switch ────────────────────────────────────────────
  const zoneButton = nav.querySelector<HTMLButtonElement>('[data-nav-zone]')!;
  const tip = zoneButton.querySelector<HTMLElement>('[data-nav-tip]')!;
  const showZone = (zone: Zone) => {
    zoneButton.setAttribute('aria-pressed', String(zone === 'white'));
    // The tip names where the button goes next.
    tip.textContent = (zone === 'white' ? zoneButton.dataset.toBlack : zoneButton.dataset.toWhite) ?? '';
  };
  showZone(currentZone());
  onZoneChange(showZone);
  onZoneBusy((busy) => (busy ? zoneButton.setAttribute('aria-disabled', 'true') : zoneButton.removeAttribute('aria-disabled')));
  zoneButton.addEventListener('click', () => void setZone(currentZone() === 'white' ? 'black' : 'white', zoneButton));

  nav.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => magnetic(el, 0.3));

  // ── Geometry ───────────────────────────────────────────────
  const list = nav.querySelector<HTMLElement>('[data-seam-list]')!;
  const cells = [...list.children] as HTMLElement[];
  // Sections the page actually has, in nav order, each with its cell in the index row.
  const tracked = cells.flatMap((cell) => {
    const id = cell.querySelector('a')!.hash.slice(1);
    const el = document.getElementById(id);
    return el ? [{ id, el, cell }] : [];
  });
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('a[data-nav-link]')];
  let tops: number[] = [];
  let readEnd = 0;
  let width = 0;
  let stops: number[] = [];
  let compact = false;
  let barH = 0;
  let plateFrom = 0;
  let ctaFrom = 0;
  // Last seam position written to the DOM; NaN forces the next frame to write.
  let shownX = NaN;
  let shownSkew = NaN;

  const measure = () => {
    tops = tracked.map(({ el }) => el.getBoundingClientRect().top + scrollY);
    // Where the reading line sits at the very bottom of the page.
    readEnd = document.documentElement.scrollHeight - innerHeight * (1 - READING_LINE);
    width = list.offsetWidth;
    stops = [...tracked.map(({ cell }) => cell.offsetLeft), width];
    compact = toggle.offsetWidth > 0;
    barH = head.offsetHeight;
    plateFrom = hero ? hero.getBoundingClientRect().bottom + scrollY - barH : 0;
    ctaFrom = hero ? innerHeight * 0.3 : 0;
    const gap = parseFloat(getComputedStyle(actions).columnGap) || 0;
    nav.style.setProperty('--cta-shift', `${cta.offsetWidth ? cta.offsetWidth + gap : 0}px`);
    shownX = NaN;
    if (!compact && menuOpen) closeMenu(false);
  };

  // ── Bar states ─────────────────────────────────────────────
  let lastY = scrollY;
  let travel = 0;
  const onScroll = () => {
    const y = scrollY;
    nav.toggleAttribute('data-plated', y > plateFrom);
    nav.toggleAttribute('data-cta', y > ctaFrom);
    // Compact bars get out of the way while reading down and return on the way back up;
    // they stay while the menu is open or a control inside has keyboard focus.
    const dy = y - lastY;
    lastY = y;
    travel = Math.sign(dy) === Math.sign(travel) ? travel + dy : dy;
    if (!compact || menuOpen || y < barH || nav.querySelector(':focus-visible')) delete nav.dataset.hidden;
    else if (travel > 32) nav.dataset.hidden = '';
    else if (travel < -32) delete nav.dataset.hidden;
  };

  // ── The seam index ─────────────────────────────────────────
  // A miniature of the hero's tear runs through the row of links. Left of it the row is
  // honest (solid, red numbers); right of it, still gray. It travels with the reader:
  // through a section's own link while reading it, across the gap at the next section, and
  // past the last link at the bottom of the page. A mouse over the row pulls it along, as the
  // cursor pulls the hero's seam.
  const clip = nav.querySelector<HTMLElement>('[data-seam-clip]')!;
  const row = nav.querySelector<HTMLElement>('[data-seam-row]')!;
  const fill = nav.querySelector<HTMLElement>('[data-seam-fill]')!;
  const line = nav.querySelector<HTMLElement>('[data-seam-line]')!;
  let x = 0;
  let v = 0;
  let pull: number | null = null;
  let current = -2;

  list.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    pull = Math.max(0, Math.min(width, e.clientX - list.getBoundingClientRect().left));
  });
  list.addEventListener('pointerleave', () => (pull = null));
  // Keyboard focus tears through the focused link, the way hover does.
  list.addEventListener('focusin', (e) => {
    const cell = (e.target as Element).closest('li');
    if (cell) pull = cell.offsetLeft + cell.offsetWidth;
  });
  list.addEventListener('focusout', () => (pull = null));

  gsap.ticker.add((_time, deltaMs) => {
    const r = scrollY + innerHeight * READING_LINE;
    let s = -1;
    while (s + 1 < tops.length && tops[s + 1] <= r) s++;
    if (s !== current) {
      current = s;
      const id = tracked[s]?.id;
      links.forEach((a) => (a.dataset.navLink === id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    }
    // Compact layouts hide the index; there is nothing to draw.
    if (!width) return;

    let target = 0;
    if (pull !== null) target = pull;
    else if (s >= 0) {
      const next = s + 1 < tops.length ? tops[s + 1] : readEnd;
      const f = Math.min(1, (r - tops[s]) / Math.max(1, next - tops[s]));
      target = stops[s] + f * (stops[s + 1] - stops[s]);
    }
    if (still) {
      x = target;
      v = 0;
    } else {
      // Slightly underdamped: the tear overshoots a hair and settles, like paper.
      const dt = Math.min(deltaMs / 1000, 1 / 30);
      v += (170 * (target - x) - 22 * v) * dt;
      x += v * dt;
      if (Math.abs(target - x) < 0.05 && Math.abs(v) < 1) {
        x = target;
        v = 0;
      }
    }
    // The tear leans against its own motion.
    const skew = Math.max(-12, Math.min(12, v * -0.008));
    if (Math.abs(x - shownX) < 0.01 && Math.abs(skew - shownSkew) < 0.01) return;
    shownX = x;
    shownSkew = skew;
    clip.style.transform = `translate3d(${x - width}px, 0, 0)`;
    row.style.transform = `translate3d(${width - x}px, 0, 0)`;
    fill.style.transform = `scaleX(${x / width})`;
    line.style.transform = `translate3d(${x}px, 0, 0) skewX(${skew}deg)`;
  });

  measure();
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', measure);
  // Sections grow as their images decode; fonts change the row's widths.
  new ResizeObserver(measure).observe(document.body);
  void document.fonts.ready.then(measure);

  // ── Intro ──────────────────────────────────────────────────
  // Starts under the preloader; lands just after the hero's headline begins to rise.
  if (still) return;
  const mark = nav.querySelector<SVGElement>('[data-nav-mark]')!;
  const word = nav.querySelector<HTMLElement>('[data-nav-word]')!;
  const track = nav.querySelector<HTMLElement>('[data-seam-track]')!;
  const rises = [...nav.querySelectorAll<HTMLElement>('.nav__rise')];
  const controls = [zoneButton, nav.querySelector<HTMLElement>('[data-nav-lang]')!, toggle];
  gsap.set(mark, { scale: 0, rotation: -120 });
  gsap.set(word, { opacity: 0, x: -12 });
  gsap.set(rises, { yPercent: 110 });
  gsap.set(track, { scaleX: 0, transformOrigin: 'left center' });
  gsap.set(line, { opacity: 0 });
  gsap.set(controls, { opacity: 0, y: -10 });

  void appReady.then(() => {
    const tl = gsap.timeline({ delay: 0.45 });
    tl.to(mark, { scale: 1, rotation: 0, duration: 1.6 }, 0).to(word, { opacity: 1, x: 0, duration: 1.2 }, 0.15);
    // Both copies of a link rise together, so the honest row stays registered over the gray one.
    cells.forEach((_, i) => tl.to(rises.filter((el) => el.dataset.i === String(i)), { yPercent: 0, duration: 1.1 }, 0.25 + i * 0.07));
    tl.to(track, { scaleX: 1, duration: 1.6, ease: 'expo.inOut' }, 0.2)
      .to(line, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.9)
      .to(controls, { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 0.35);
  });
}
