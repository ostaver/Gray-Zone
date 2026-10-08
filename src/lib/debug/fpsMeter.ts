/**
 * Debug only. Counts frames on its own rAF loop, apart from GSAP's ticker, so it reads how often
 * the page is actually presented. Mounted by `FpsStats.astro`, which only renders in dev builds.
 */
export function mountFpsMeter(root: HTMLElement): void {
  const fpsEl = root.querySelector<HTMLElement>('[data-fps]')!;
  const avgEl = root.querySelector<HTMLElement>('[data-avg]')!;
  const worstEl = root.querySelector<HTMLElement>('[data-worst]')!;

  let windowStart = performance.now();
  let last = windowStart;
  let frames = 0;
  let total = 0;
  let worst = 0;

  const reset = (now: number) => {
    windowStart = now;
    frames = 0;
    total = 0;
    worst = 0;
  };

  let id = 0;
  const loop = (now: number) => {
    id = requestAnimationFrame(loop);
    const dt = now - last;
    last = now;
    // A background tab pauses rAF; that gap is not a dropped frame.
    if (dt > 1000) return reset(now);

    frames++;
    total += dt;
    worst = Math.max(worst, dt);

    const elapsed = now - windowStart;
    if (elapsed < 1000) return;
    // Written once a second: the readout itself should not cost frames.
    fpsEl.textContent = String(Math.round((frames * 1000) / elapsed));
    avgEl.textContent = (total / frames).toFixed(1);
    worstEl.textContent = worst.toFixed(1);
    reset(now);
  };
  id = requestAnimationFrame(loop);

  // Dev HMR re-runs module scripts; without this each reload would stack another loop.
  import.meta.hot?.dispose(() => cancelAnimationFrame(id));
}
