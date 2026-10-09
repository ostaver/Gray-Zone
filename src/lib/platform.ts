export type Platform = 'windows' | 'mac';

interface UADataNavigator extends Navigator {
  userAgentData?: { platform?: string; mobile?: boolean };
}


/** Includes iPadOS desktop user agents; touch laptops are not treated as phones. */
function isMobileDevice(): boolean {
  const nav = navigator as UADataNavigator;
  const source = `${nav.userAgentData?.platform ?? ''} ${nav.userAgent}`.toLowerCase();
  return nav.userAgentData?.mobile === true ||
    /android|iphone|ipad|ipod|mobile|phone/.test(source) ||
    (/mac/.test(source) && nav.maxTouchPoints > 1);
}
/** Desktop OS the game ships for, or null (mobile, Linux, unknown). */
export function detectPlatform(): Platform | null {
  const nav = navigator as UADataNavigator;
  if (isMobileDevice()) return null;
  const source = `${nav.userAgentData?.platform ?? ''} ${navigator.userAgent}`.toLowerCase();
  // iPadOS reports "Macintosh" but has touch points.
  if (/mac/.test(source) && navigator.maxTouchPoints <= 1) return 'mac';
  if (/win/.test(source) && !/phone|mobile/.test(source)) return 'windows';
  return null;
}
