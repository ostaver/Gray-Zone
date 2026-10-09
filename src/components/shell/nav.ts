import { coarsePointer, gsap, reducedMotion } from '../../lib/motion/gsap';
import { lockScroll } from '../../lib/motion/scroll';
import { magnetic } from '../../lib/motion/magnetic';
import { appReady, onCleanup } from '../../lib/lifecycle';
import { currentZone, onZoneBusy, onZoneChange, setZone, type Zone } from '../../lib/zone';

/** The reader is "in" a section once its top passes this fraction of the viewport. */
const READING_LINE = 0.4;
/** The merged logo's diameter, rem. */
const LOGO_REM = 3.5;
/** Where the logo's letters sit in the disc, as fractions of its diameter (from logo.svg). */
const LOGO_WORD = { x: 0.2314, y: 0.2964, w: 0.5341, h: 0.3835 };

export function initNav(nav: HTMLElement): void {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  onCleanup(() => controller.abort());
  const still = reducedMotion.matches;
  const head = nav.querySelector<HTMLElement>('[data-nav-head]')!;
  const actions = nav.querySelector<HTMLElement>('[data-nav-actions]')!;
  const cta = nav.querySelector<HTMLElement>('[data-nav-cta]')!;
  const toggle = nav.querySelector<HTMLButtonElement>('[data-nav-toggle]')!;
  const background = [...document.querySelectorAll<HTMLElement>('main, footer, [data-privacy-consent]')];
  const hero = document.querySelector<HTMLElement>('[data-hero]');

  // ── Menu (compact layouts) ─────────────────────────────────
  const menu = nav.querySelector<HTMLElement>('[data-nav-menu]')!;
  const panel = menu.querySelector<HTMLElement>('[data-nav-panel]')!;
  const tear = menu.querySelector<SVGPathElement>('[data-menu-tear]')!;
  const [dotsHonest, dotsGray] = [...menu.querySelectorAll<HTMLElement>('[data-menu-dots]')];
  const words = [...menu.querySelectorAll<HTMLElement>('[data-menu-word]')];
  const footEl = menu.querySelector<HTMLElement>('[data-menu-foot]')!;
  const labels = [...footEl.querySelectorAll<HTMLElement>('dt')];
  const [langs, platforms, contact] = [...footEl.querySelectorAll<HTMLElement>('dd')];
  const contactLinks = [...contact.children] as HTMLElement[];
  const menuCta = footEl.querySelector<HTMLElement>('[data-menu-cta]')!;
  const labelText = labels.map((el) => el.textContent ?? '');
  const scrambleChars = labelText.join('').replace(/\s/g, '');
  const details = [...labels, langs, platforms, ...contactLinks, menuCta];
  const parts = [dotsHonest, dotsGray, ...words, ...details];
  const rnd = gsap.utils.random;
  let menuOpen = false;
  let menuTl: gsap.core.Timeline | null = null;
  menu.inert = true;
  gsap.set(panel, { xPercent: 100 });

  /** Back to rest: whatever an interrupted open or close left mid-flight. */
  const resetMenu = () => {
    gsap.set(parts, { clearProps: 'transform,opacity' });
    labels.forEach((el, i) => (el.textContent = labelText[i]));
  };

  // Every link comes in its own way, so the list lands as a jumble before it lines up.
  const wordIn: (() => [from: gsap.TweenVars, to: gsap.TweenVars])[] = [
    // Slung in from beyond the right edge, sheared by the speed, overshooting.
    () => [{ xPercent: 170, skewX: -38, opacity: 0 }, { xPercent: 0, skewX: 0, opacity: 1, duration: 1.1, ease: 'back.out(2.4)' }],
    // Dropped from above on a hinge at its left foot, swinging until it hangs straight.
    () => [{ yPercent: -280, rotation: rnd(-34, -18), transformOrigin: '0% 100%' }, { yPercent: 0, rotation: 0, duration: 1.7, ease: 'elastic.out(1, 0.35)' }],
    // Slammed down out of the reader's face: huge and faint, then hard onto the page.
    () => [{ scale: 3.2, rotation: rnd(-14, 14), opacity: 0, transformOrigin: '30% 50%' }, { scale: 1, rotation: 0, opacity: 1, duration: 0.65, ease: 'power4.in' }],
    // Turned over on its baseline like a card flipped face up.
    () => [{ rotationX: -110, transformPerspective: 500, transformOrigin: '50% 100%', opacity: 0 }, { rotationX: 0, opacity: 1, duration: 1.4, ease: 'elastic.out(1, 0.45)' }],
    // Squashed flat under the line, then sprung up to height.
    () => [{ yPercent: 120, scaleX: 1.7, scaleY: 0.15, transformOrigin: '0% 100%' }, { yPercent: 0, scaleX: 1, scaleY: 1, duration: 1.3, ease: 'elastic.out(1.1, 0.32)' }],
  ];

  const openMenu = () => {
    if (menuOpen) return;
    menuOpen = true;
    nav.dataset.menu = '';
    delete nav.dataset.hidden;
    toggle.setAttribute('aria-expanded', 'true');
    menu.inert = false;
    // Like a dialog: the page underneath is out of reach until the menu closes.
    background.forEach((el) => {
      if (el.inert) return;
      el.dataset.menuInert = '';
      el.inert = true;
    });
    lockScroll(true);
    menuTl?.kill();
    resetMenu();
    const tl = gsap.timeline().set(menu, { visibility: 'visible' });
    menuTl = tl;
    // The sheet: thrown in from the side, leaning back against its own speed, and it shudders
    // as it hits the far edge.
    tl.to(panel, { xPercent: 0, duration: 0.85, ease: 'tear' }, 0)
      .fromTo(panel, { skewX: -9, transformOrigin: '0% 50%' }, { skewX: 0, duration: 1.2, ease: 'elastic.out(1, 0.4)' }, 0)
      .to(panel, { keyframes: { x: [0, -16, 11, -6, 3, 0] }, duration: 0.45, ease: 'none' }, 0.55);
    // The fields: the honest dots flicker on like a tube light, the gray ones drift in, and the
    // tear rips outward from its middle.
    tl.fromTo(dotsHonest, { opacity: 0 }, { keyframes: { opacity: [0, 0.7, 0.05, 0.55, 0, 0.7] }, duration: 0.7, ease: 'none' }, 0.45)
      .fromTo(dotsGray, { opacity: 0, xPercent: 18 }, { opacity: 0.7, xPercent: 0, duration: 1.6, ease: 'expo.out' }, 0.35)
      .fromTo(tear, { drawSVG: '50% 50%' }, { drawSVG: '0% 100%', duration: 1.1, ease: 'expo.inOut' }, 0.3);
    // The links, each its own way, in a shuffled order.
    const order = gsap.utils.shuffle(words.map((_, i) => i));
    words.forEach((el, i) => tl.fromTo(el, ...wordIn[i % wordIn.length](), 0.3 + order.indexOf(i) * 0.08));
    // The details: labels decode, the languages pop, the platforms shear in, the contacts drop
    // and bounce, and the button is pulled out like tape.
    labels.forEach((el, i) => tl.to(el, { duration: 1, scrambleText: { text: labelText[i], chars: scrambleChars, speed: 0.5 }, ease: 'none' }, 0.6 + i * 0.1));
    tl.fromTo(langs, { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: 0.9, ease: 'back.out(3)' }, 0.75)
      .fromTo(platforms, { x: -60, skewX: 30, opacity: 0 }, { x: 0, skewX: 0, opacity: 1, duration: 1.1, ease: 'expo.out' }, 0.8)
      .fromTo(contactLinks, { y: -50, rotation: (i: number) => (i % 2 ? 9 : -9), opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 1.1, stagger: 0.12, ease: 'bounce.out' }, 0.85)
      .fromTo(menuCta, { scaleX: 0, transformOrigin: '100% 50%' }, { scaleX: 1, duration: 1.2, ease: 'elastic.out(1, 0.5)' }, 0.95);
    if (still) tl.progress(1);
  };

  /** `restoreFocus`: hand focus back to the toggle if it was inside the menu. */
  const closeMenu = (restoreFocus: boolean) => {
    if (!menuOpen) return;
    menuOpen = false;
    delete nav.dataset.menu;
    toggle.setAttribute('aria-expanded', 'false');
    background.forEach((el) => {
      if (!el.hasAttribute('data-menu-inert')) return;
      el.inert = false;
      delete el.dataset.menuInert;
    });
    lockScroll(false);
    if (restoreFocus && menu.contains(document.activeElement)) toggle.focus();
    menu.inert = true;
    menuTl?.kill();
    labels.forEach((el, i) => (el.textContent = labelText[i]));
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(menu, { visibility: 'hidden' });
        resetMenu();
      },
    });
    menuTl = tl;
    // Everything is flung apart before the sheet is torn away: links scatter, details fall.
    tl.to(words, { x: () => rnd(-320, 320), y: () => rnd(-220, 220), rotation: () => rnd(-70, 70), opacity: 0, duration: 0.55, ease: 'power3.in', stagger: { each: 0.03, from: 'random' } }, 0)
      .to(details, { y: () => innerHeight * rnd(0.3, 0.6), rotation: () => rnd(-45, 45), opacity: 0, duration: 0.6, ease: 'power2.in', stagger: { each: 0.02, from: 'random' } }, 0)
      .to([dotsHonest, dotsGray], { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0)
      .to(tear, { drawSVG: '50% 50%', duration: 0.45, ease: 'power3.in' }, 0)
      .to(panel, { xPercent: 100, skewX: 10, duration: 0.7, ease: 'expo.in' }, 0.2)
      .set(panel, { skewX: 0 });
    if (still) tl.progress(1);
  };

  toggle.addEventListener('click', () => (menuOpen ? closeMenu(true) : openMenu()));
  document.addEventListener('keydown', (e) => {
    // An open dialog (download) owns Escape; it sits above the menu.
    if (e.key !== 'Escape' || !menuOpen || document.querySelector('dialog[open]')) return;
    closeMenu(true);
  });

  // Close the menu before the shared link router focuses its destination.
  nav.addEventListener('click', (e) => {
    const link = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (link && !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) closeMenu(false);
  });
  nav.querySelectorAll<HTMLAnchorElement>('a[data-lang]').forEach((link) => {
    const update = () => { link.hash = location.hash; };
    update();
    window.addEventListener('hashchange', update, options);
    window.addEventListener('popstate', update, options);
    window.addEventListener('grayzone:section', update, options);
    link.addEventListener('click', update, options);
  });

  // ── Zone switch ────────────────────────────────────────────
  const zoneButton = nav.querySelector<HTMLButtonElement>('[data-nav-zone]')!;
  const tip = zoneButton.querySelector<HTMLElement>('[data-nav-tip]')!;
  const showZone = (zone: Zone) => {
    zoneButton.setAttribute('aria-pressed', String(zone === 'white'));
    // The toggle's fixed accessible name means "white zone"; only its visual tip names the next choice.
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
    const showCta = y > ctaFrom;
    nav.toggleAttribute('data-cta', showCta);
    const ctaHidden = !showCta;
    if (cta.inert !== ctaHidden) cta.inert = ctaHidden;
    // Compact bars get out of the way while reading down and return on the way back up;
    // they stay while the menu is open or a control inside has keyboard focus.
    const dy = y - lastY;
    lastY = y;
    travel = Math.sign(dy) === Math.sign(travel) ? travel + dy : dy;
    if (!compact || menuOpen || y < barH || nav.contains(document.activeElement)) delete nav.dataset.hidden;
    else if (travel > 32) nav.dataset.hidden = '';
    else if (travel < -32) delete nav.dataset.hidden;
  };
  nav.addEventListener('focusin', () => {
    delete nav.dataset.hidden;
    travel = 0;
    gsap.set(nav.querySelectorAll('.nav__rise'), { yPercent: 0 });
    gsap.set([zoneButton, nav.querySelector('[data-nav-lang]'), toggle], { opacity: 1, y: 0 });
  }, options);

  // ── The seam index ─────────────────────────────────────────
  // A miniature of the hero's tear runs through the row of links. Left of it the row is
  // honest (solid type); right of it, still gray. It travels with the reader:
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

  // ── Brand: disc and word merge into the logo ───────────────
  // Over the hero's scroll the disc rolls out to the logo's size while the word slides into it
  // and shrinks to fit, taking the logo's split colours; scrolling back up pulls them apart.
  // The word stays live type in the disc (the logo's drawn letters are never swapped in), so
  // the merged logo can still move on hover.
  const brand = nav.querySelector<HTMLElement>('[data-nav-brand]')!;
  const mark = nav.querySelector<SVGSVGElement>('[data-nav-mark]')!;
  const word = nav.querySelector<HTMLElement>('[data-nav-word]')!;
  const merge = { t: 0 };
  let brandGeo = { mark: 0, logo: 0, wordW: 0, wordH: 0, wordC: 0 };
  let shownMerge = NaN;
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const ease = gsap.parseEase('power3.inOut');
  const drawBrand = () => {
    const t = merge.t;
    if (t === shownMerge) return;
    shownMerge = t;
    const { mark: m, logo, wordW, wordH, wordC } = brandGeo;
    if (!m || !wordW) return;
    // The disc leads, the word follows it in and lands where the logo's letters sit.
    const d = ease(clamp01(t / 0.7));
    const w = ease(clamp01((t - 0.15) / 0.7));
    const s = 1 + d * (logo / m - 1);
    // Grows from its left edge, so the logo keeps the gutter; rolls a full turn on the way. The
    // shift goes in `translate`, which applies outside the hover's CSS `rotate`, so a turn on
    // hover spins the disc in place instead of swinging it around its old centre.
    mark.style.translate = d ? `${(m * (s - 1)) / 2}px 0` : '';
    mark.style.transform = d ? `rotate(${d * 360}deg) scale(${s})` : '';
    const dx = logo * (LOGO_WORD.x + LOGO_WORD.w / 2) - wordC;
    const dy = logo * (LOGO_WORD.y + LOGO_WORD.h / 2 - 0.5);
    const sx = 1 + w * ((LOGO_WORD.w * logo) / wordW - 1);
    const sy = 1 + w * ((LOGO_WORD.h * logo) / wordH - 1);
    word.style.transform = w ? `translate3d(${w * dx}px, ${w * dy}px, 0) scale(${sx}, ${sy})` : '';
    brand.style.setProperty('--merge', String(w));
    brand.toggleAttribute('data-merged', t > 0.001);
  };
  const measureBrand = () => {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    // The box's trailing letter-spacing is not ink: leave it out of the fit.
    const tracking = parseFloat(getComputedStyle(word).letterSpacing) || 0;
    const wordW = word.offsetWidth - tracking;
    // The tilt's transform makes the brand the word's offset parent; before it, the bar is.
    const wordX = word.offsetParent === brand ? word.offsetLeft : word.offsetLeft - brand.offsetLeft;
    brandGeo = { mark: mark.clientWidth, logo: LOGO_REM * rem, wordW, wordH: word.offsetHeight, wordC: wordX + wordW / 2 };
    shownMerge = NaN;
    drawBrand();
  };
  if (hero) {
    gsap.to(merge, {
      t: 1,
      ease: 'none',
      duration: still ? 0 : 1,
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom bottom',
        // Reduced motion: no scrub, just the two states either side of the hero's middle.
        scrub: still ? false : 0.6,
        toggleActions: 'play none none reverse',
        ...(still && { start: 'center top', end: 'center top' }),
      },
      onUpdate: drawBrand,
    });
  }

  // Under a mouse the logo tips toward the cursor like a coin on its edge, and springs back flat.
  if (!still && !coarsePointer.matches) {
    gsap.set(brand, { transformPerspective: 260 });
    const tiltX = gsap.quickTo(brand, 'rotationX', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const tiltY = gsap.quickTo(brand, 'rotationY', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    // Merged, it pivots on the disc's centre, at the brand's left (the disc grows from there).
    brand.addEventListener('pointerenter', () => {
      gsap.set(brand, { transformOrigin: brand.hasAttribute('data-merged') ? `${brandGeo.logo / 2}px 50%` : '50% 50%' });
    });
    brand.addEventListener('pointermove', (e) => {
      // The disc is the merged logo's face; apart, the whole brand is.
      const r = (brand.hasAttribute('data-merged') ? mark : brand).getBoundingClientRect();
      tiltY(((e.clientX - r.left) / r.width - 0.5) * 36);
      tiltX(((e.clientY - r.top) / r.height - 0.5) * -36);
    });
    brand.addEventListener('pointerleave', () => {
      tiltX(0);
      tiltY(0);
    });
  }

  measure();
  measureBrand();
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', measure);
  // Sections grow as their images decode; fonts change the row's widths.
  new ResizeObserver(measure).observe(document.body);
  new ResizeObserver(measureBrand).observe(word);
  void document.fonts.ready.then(() => {
    measure();
    measureBrand();
  });
  nav.dataset.enhanced = '';

  // ── Intro ──────────────────────────────────────────────────
  // Starts under the preloader; lands just after the hero's headline begins to rise.
  if (still) return;
  const track = nav.querySelector<HTMLElement>('[data-seam-track]')!;
  const rises = [...nav.querySelectorAll<HTMLElement>('.nav__rise')];
  const controls = [zoneButton, nav.querySelector<HTMLElement>('[data-nav-lang]')!, toggle];
  gsap.set(rises, { yPercent: 110 });
  gsap.set(track, { scaleX: 0, transformOrigin: 'left center' });
  gsap.set(line, { opacity: 0 });
  gsap.set(controls, { opacity: 0, y: -10 });

  void appReady.then(() => {
    const tl = gsap.timeline({ delay: 0.45 });
    // Both copies of a link rise together, so the honest row stays registered over the gray one.
    cells.forEach((_, i) => tl.to(rises.filter((el) => el.dataset.i === String(i)), { yPercent: 0, duration: 1.1 }, 0.25 + i * 0.07));
    tl.to(track, { scaleX: 1, duration: 1.6, ease: 'expo.inOut' }, 0.2)
      .to(line, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.9)
      .to(controls, { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 0.35);
  });
}
