import { gsap, reducedMotion } from '../../lib/motion/gsap';
import { onCleanup } from '../../lib/lifecycle';

/** How lazily the blob trails the pointer (s), and how it stretches with speed. */
const FOLLOW_TAU = 0.2;
const SQUASH_TAU = 0.09;
const SQUASH_PER_PX_PER_SEC = 0.0011;
const SQUASH_MAX = 1.6;
/** The blob's diameter against the button's height. */
const BLOB_SCALE = 1.7;

/**
 * Drives one liquid-carve button. The blob trails the pointer on gsap's ticker only while it
 * is showing; at rest the button costs nothing.
 */
export function initLiquidButton(button: HTMLElement): void {
  const bite = button.querySelector<SVGCircleElement>('[data-liquid-bite]');
  if (!bite) return;
  const controller = new AbortController();
  const options = { signal: controller.signal };
  // Offsets from the button's centre: where the blob is (x, y) and where it is headed (tx, ty).
  const st = { x: 0, y: 0, tx: 0, ty: 0, squash: 1, angle: 0, size: 0 };
  let box = { w: 0, h: 0, left: 0, top: 0 };
  let hovered = false;
  let running = false;

  const measure = () => {
    const r = button.getBoundingClientRect();
    box = { w: r.width, h: r.height, left: r.left, top: r.top };
    bite.setAttribute('r', ((r.height * BLOB_SCALE) / 2).toFixed(1));
  };
  const aim = (e: PointerEvent) => {
    // The page may have scrolled under a still pointer; read the box fresh.
    measure();
    st.tx = e.clientX - (box.left + box.w / 2);
    st.ty = e.clientY - (box.top + box.h / 2);
  };
  const draw = () => {
    const k = st.size;
    bite.setAttribute(
      'transform',
      `translate(${(box.w / 2 + st.x).toFixed(1)} ${(box.h / 2 + st.y).toFixed(1)}) rotate(${st.angle.toFixed(1)}) scale(${(k * st.squash).toFixed(3)} ${(k / st.squash).toFixed(3)})`,
    );
  };

  const tick = (_time: number, deltaMs: number) => {
    const dt = Math.min(0.05, Math.max(0.001, deltaMs / 1000));
    const still = reducedMotion.matches;
    const f = still ? 1 : 1 - Math.exp(-dt / FOLLOW_TAU);
    const dx = (st.tx - st.x) * f;
    const dy = (st.ty - st.y) * f;
    st.x += dx;
    st.y += dy;
    const speed = Math.hypot(dx, dy) / dt;
    const want = still ? 1 : Math.min(SQUASH_MAX, 1 + speed * SQUASH_PER_PX_PER_SEC);
    st.squash += (want - st.squash) * (1 - Math.exp(-dt / SQUASH_TAU));
    if (speed > 8) st.angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    draw();
    // Gone and settled: stop until the next hover.
    if (!hovered && st.size === 0) stop();
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
  const show = (on: boolean) => {
    hovered = on;
    start();
    gsap.to(st, {
      size: on ? 1 : 0,
      duration: reducedMotion.matches ? 0 : on ? 0.8 : 0.6,
      ease: on ? 'sine.inOut' : 'power2.in',
      overwrite: true,
    });
  };

  button.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    aim(e);
    // Born where the pointer came in, not swept over from the middle.
    st.x = st.tx;
    st.y = st.ty;
    show(true);
  }, options);
  button.addEventListener('pointermove', (e) => {
    if (hovered && e.pointerType !== 'touch') aim(e);
  }, options);
  button.addEventListener('pointerleave', () => {
    if (hovered) show(false);
  }, options);
  // Keyboard focus carves the middle, so the button shows it is the one in hand.
  button.addEventListener('focus', () => {
    if (hovered || !button.matches(':focus-visible')) return;
    measure();
    st.x = st.tx = 0;
    st.y = st.ty = 0;
    show(true);
  }, options);
  button.addEventListener('blur', () => {
    if (!button.matches(':hover')) show(false);
  }, options);

  onCleanup(() => {
    controller.abort();
    stop();
    gsap.killTweensOf(st);
  });
}
