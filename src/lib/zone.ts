import { transitionZone } from './motion/zoneTransition';

/** Page palette: "white" (light surfaces) or "black" (the default dark/red). */
export type Zone = 'white' | 'black';

const changeListeners = new Set<(zone: Zone) => void>();
const busyListeners = new Set<(busy: boolean) => void>();
let busy = false;

/** The zone the page shows now; black unless switched during this visit. */
export function currentZone(): Zone {
  return document.documentElement.dataset.zone === 'white' ? 'white' : 'black';
}

/**
 * `fn` runs inside the transition's update, before the new frame is captured, so anything
 * that draws (the WebGL stage) must redraw synchronously there. Returns an unsubscribe.
 */
export function onZoneChange(fn: (zone: Zone) => void): () => void {
  changeListeners.add(fn);
  return () => void changeListeners.delete(fn);
}

/** `fn(true)` when a switch starts, `fn(false)` once its reveal has finished. Returns an unsubscribe. */
export function onZoneBusy(fn: (busy: boolean) => void): () => void {
  busyListeners.add(fn);
  return () => void busyListeners.delete(fn);
}

/**
 * Switch the page to `zone`, blooming out from `origin`. Every zone control goes through here,
 * so a switch started anywhere can't overlap another; repeats and mid-switch requests are ignored.
 */
export async function setZone(zone: Zone, origin: HTMLElement): Promise<void> {
  if (busy || zone === currentZone()) return;
  busy = true;
  busyListeners.forEach((fn) => fn(true));
  try {
    await transitionZone(origin, zone === 'white', () => {
      const root = document.documentElement;
      root.dataset.zone = zone;
      document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(root).getPropertyValue('--ink').trim());
      changeListeners.forEach((fn) => fn(zone));
    });
  } finally {
    busy = false;
    busyListeners.forEach((fn) => fn(false));
  }
}
