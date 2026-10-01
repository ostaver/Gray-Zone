/**
 * Page-level gates.
 * - `trackAsset(p)`: sections register work the preloader should wait for (textures, decodes).
 * - `assetProgress()`: fraction of tracked assets settled so far (0..1).
 * - `assetsSettled()`: resolves when every tracked asset settles (or after `timeoutMs`).
 * - `appReady`: resolved by the preloader when its exit begins; intros await it.
 */
const pending: Promise<unknown>[] = [];
let settledCount = 0;

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
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
  await Promise.race([Promise.allSettled(pending), timeout]);
}

// Plain executors, not Promise.withResolvers: this module loads on every page and must
// evaluate on Safari < 17.4.
let resolveReady!: () => void;
export const appReady = new Promise<void>((resolve) => {
  resolveReady = resolve;
});
export const signalReady = (): void => resolveReady();
