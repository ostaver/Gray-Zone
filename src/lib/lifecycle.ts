/**
 * Page-level gates.
 * - `trackAsset(p)`: sections register work the preloader should wait for (textures, decodes).
 * - `assetProgress()`: fraction of tracked assets settled so far (0..1).
 * - `assetsSettled()`: resolves when every tracked asset settles (or after `timeoutMs`).
 * - `appReady`: resolved by the preloader when its exit begins; intros await it.
 */
const pending: Promise<unknown>[] = [];
let settledCount = 0;

const cleanups = new Set<() => void>();
/** Register page-owned work; bfcache pages keep their live state until a real departure. */
export function onCleanup(cleanup: () => void): () => void {
  cleanups.add(cleanup);
  return () => { cleanups.delete(cleanup); };
}
window.addEventListener('pagehide', (event) => {
  if (event.persisted) return;
  for (const cleanup of cleanups) {
    try { cleanup(); }
    catch (error) { console.warn('[lifecycle] cleanup failed', error); }
  }
  cleanups.clear();
});

export function trackAsset(p: Promise<unknown>): void {
  pending.push(p);
  const count = () => void settledCount++;
  p.then(count, count);
}

export function assetProgress(): number {
  return pending.length === 0 ? 1 : settledCount / pending.length;
}

export async function assetsSettled(timeoutMs = 4000): Promise<void> {
  // Let sibling module scripts register first.
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  let timer: number | undefined;
  const timeout = new Promise<void>((resolve) => { timer = window.setTimeout(resolve, timeoutMs); });
  await Promise.race([Promise.allSettled(pending), timeout]);
  clearTimeout(timer);
}

// Plain executors, not Promise.withResolvers: this module loads on every page and must
// evaluate on Safari < 17.4.
let resolveReady!: () => void;
export const appReady = new Promise<void>((resolve) => {
  resolveReady = resolve;
});
let ready = false;
const fallback = setTimeout(() => signalReady(), 6000);
export const signalReady = (): void => {
  if (ready) return;
  ready = true;
  clearTimeout(fallback);
  resolveReady();
  window.dispatchEvent(new Event('grayzone:ready'));
};
window.addEventListener('grayzone:ready', signalReady);
if (document.documentElement.hasAttribute('data-app-ready')) signalReady();
onCleanup(() => {
  clearTimeout(fallback);
  window.removeEventListener('grayzone:ready', signalReady);
});
