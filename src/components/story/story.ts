import { gsap, ScrollTrigger, reducedMotion } from '../../lib/motion/gsap';
import { scrollToTarget } from '../../lib/motion/scroll';
import { verdictFor } from '../../data/story';
import { onCleanup } from '../../lib/lifecycle';
import { flapBoard } from '../../lib/motion/flap';

/** Timeline units each form holds before it's ripped off, and how long the rip takes. */
const HOLD = 0.55;
const RIP = 0.45;

export function initStory(root: HTMLElement): void {
  const sheets = [...root.querySelectorAll<HTMLElement>('[data-sheet]')];
  const inputs = [...root.querySelectorAll<HTMLInputElement>('input[data-step]')];
  const decision = root.querySelector<HTMLElement>('[data-decision]')!;
  const verdicts = [...decision.querySelectorAll<HTMLElement>('[data-verdict]')];
  // One split-flap board per verdict; only the current verdict's is showing.
  const boards = new Map(verdicts.map((el) => [el.dataset.verdict!, flapBoard(el.querySelector<HTMLElement>('[data-flap]')!)] as const));

  // ── The decision follows the boxes ticked ──────────────────
  let shown: string | null = null;
  /** Re-reads the ticks; true when the verdict changed. */
  const decide = (): boolean => {
    let shortcuts = 0;
    for (const input of inputs) {
      if (!input.checked) continue;
      if (input.value === 'shortcut') shortcuts++;
      const mark = decision.querySelector<HTMLElement>(`[data-mark="${input.dataset.step}"]`)!;
      mark.dataset.taken = input.value;
      mark.textContent = (input.value === 'shortcut' ? decision.dataset.shortcut : decision.dataset.honest) ?? '';
    }
    const verdict = verdictFor(shortcuts);
    verdicts.forEach((el) => (el.hidden = el.dataset.verdict !== verdict));
    const changed = verdict !== shown;
    shown = verdict;
    return changed;
  };
  decide();

  // ── The pad: each form is tugged, then thrown off, alternating sides ──
  let atDecision = true;
  // The verdict clatters into place: from blank when the decision comes up, and again from what
  // it showed if a changed tick changes the verdict.
  const flip = () => {
    const board = boards.get(shown ?? '');
    if (board && !reducedMotion.matches) board.flip();
  };

  let trigger: ScrollTrigger | null = null;
  let advanceCall: gsap.core.Tween | null = null;
  const media = gsap.matchMedia();
  onCleanup(() => media.revert());
  media.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    root.dataset.pad = '';
    atDecision = false;
    for (const board of boards.values()) board.blank();
    // Checked on the timeline's own updates: with scrub it keeps moving after the scroll stops.
    const pad = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate: () => {
        const reached = pad.time() >= sheets.length - 0.02;
        if (reached === atDecision) return;
        atDecision = reached;
        if (reached) flip();
        else for (const board of boards.values()) board.blank();
      },
    });
    sheets.forEach((sheet, i) => {
      const side = i % 2 ? 1 : -1;
      const at = i + HOLD;
      // Thrown clear of the viewport on its side, with room for the spin (layout px, so the
      // throw doesn't depend on where the tug left it).
      const away = () => (side < 0 ? -(sheet.offsetLeft + sheet.offsetWidth) : innerWidth - sheet.offsetLeft) + side * sheet.offsetHeight * 0.9;
      pad.to(sheet, { y: -16, rotation: `+=${side * 2.5}`, duration: RIP * 0.25, ease: 'power1.out' }, at).to(
        sheet,
        { x: away, yPercent: -45, rotation: side * (24 + i * 5), duration: RIP * 0.75, ease: 'power2.in' },
        at + RIP * 0.25,
      );
    });
    // A beat on the decision before the section lets go.
    pad.to({}, { duration: 0.5 });
    trigger = ScrollTrigger.create({
      trigger: root,
      start: 'top top',
      end: 'bottom bottom',
      animation: pad,
      scrub: 0.7,
      invalidateOnRefresh: true,
    });
    return () => {
      advanceCall?.kill();
      advanceCall = null;
      trigger = null;
      atDecision = true;
      delete root.dataset.pad;
    };
  });

  // ── Ticking a box ──────────────────────────────────────────
  // A pointer tick rips the form off for you; keyboard selection (arrow keys move and select
  // at once) leaves the pace to the reader.
  let byPointer = false;
  root.addEventListener('pointerdown', () => (byPointer = true));
  root.addEventListener('keydown', () => (byPointer = false));
  for (const input of inputs) {
    input.addEventListener('focus', () => {
      if (!trigger || byPointer) return;
      const sheet = input.closest<HTMLElement>('[data-sheet]')!;
      const index = sheets.indexOf(sheet);
      const { start, end } = trigger;
      const total = trigger.animation?.duration() ?? 1;
      scrollToTarget(start + ((end - start) * (index + HOLD * 0.4)) / total, 0.35);
    });
    input.addEventListener('change', () => {
      if (decide() && atDecision) flip();
      if (!trigger) return;
      const tick = input.parentElement!.querySelector('.sheet__tick');
      if (tick) gsap.fromTo(tick, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.4, ease: 'power2.out' });
      // Signed once per form: changing the tick later doesn't re-sign it.
      const sheet = input.closest<HTMLElement>('[data-sheet]')!;
      const scribble = sheet.querySelector('.sheet__scribble path');
      if (scribble && !sheet.dataset.signed) {
        sheet.dataset.signed = '';
        gsap.fromTo(scribble, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.7, delay: 0.2, ease: 'power1.inOut' });
      }
      const i = sheets.indexOf(sheet);
      if (!byPointer || i < 0) return;
      const { start, end } = trigger;
      const total = trigger.animation?.duration() ?? 1;
      advanceCall?.kill();
      advanceCall = gsap.delayedCall(0.3, () => {
        if (trigger) scrollToTarget(start + ((end - start) * (i + 1)) / total, 0.8);
      });
    });
  }
}
