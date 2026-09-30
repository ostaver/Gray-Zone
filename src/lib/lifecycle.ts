/**
 * Page-level "ready" gate. A preloader (if present) calls `signalReady()` when its exit
 * begins; intros await `appReady`. Pages without a preloader resolve on boot.
 */
let resolveReady!: () => void;
export const appReady = new Promise<void>((resolve) => {
  resolveReady = resolve;
});

export function signalReady(): void {
  resolveReady();
}
