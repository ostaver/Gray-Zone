/**
 * Page-level gates.
 * - `trackAsset(p)`: sections register work the preloader should wait for (textures, decodes).
 * - `assetsSettled()`: resolves when every tracked asset settles (or after `timeoutMs`).
 * - `appReady`: resolved by the preloader when its exit begins; intros await it.
 */
const pending: Promise<unknown>[] = [];

export function trackAsset(p: Promise<unknown>): void {
  pending.push(p);
}

export async function assetsSettled(timeoutMs = 4000): Promise<void> {
  // Let sibling module scripts register first.
  const frame = Promise.withResolvers<void>();
  requestAnimationFrame(() => frame.resolve());
  await frame.promise;
  const timeout = Promise.withResolvers<void>();
  setTimeout(timeout.resolve, timeoutMs);
  await Promise.race([Promise.allSettled(pending), timeout.promise]);
}

const ready = Promise.withResolvers<void>();
export const appReady = ready.promise;
export const signalReady = (): void => ready.resolve();
