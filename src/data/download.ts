import { releaseAssets } from './links';
import type { Platform } from '../lib/platform';

export function downloadSize(platform: Platform, locale: 'mk' | 'en'): string {
  return `${(releaseAssets[platform].bytes / 1_000_000).toLocaleString(locale === 'mk' ? 'mk-MK' : 'en-US', { maximumFractionDigits: 1 })} MB`;
}
