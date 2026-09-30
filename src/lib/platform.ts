export type Platform = 'windows' | 'mac';

interface UADataNavigator extends Navigator {
  userAgentData?: { platform?: string; mobile?: boolean };
}

/** Desktop OS the game ships for, or null (mobile, Linux, unknown). */
export function detectPlatform(): Platform | null {
  const nav = navigator as UADataNavigator;
  if (nav.userAgentData?.mobile) return null;
  const source = `${nav.userAgentData?.platform ?? ''} ${navigator.userAgent}`.toLowerCase();
  // iPadOS reports "Macintosh" but has touch points.
  if (/mac/.test(source) && navigator.maxTouchPoints <= 1) return 'mac';
  if (/win/.test(source) && !/phone|mobile/.test(source)) return 'windows';
  return null;
}
