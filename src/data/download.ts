import type { Localized } from '../i18n/config';
import { releaseAssets, releaseDate, releaseTag, repo } from './links';
import type { Platform } from '../lib/platform';

export const exportPresetSource = `${repo}/blob/${releaseTag}/export_presets.cfg`;
export function downloadSize(platform: Platform, locale: 'mk' | 'en'): string {
  return `${(releaseAssets[platform].bytes / 1_000_000).toLocaleString(locale === 'mk' ? 'mk-MK' : 'en-US', { maximumFractionDigits: 1 })} MB`;
}
export function downloadDate(locale: 'mk' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'mk' ? 'mk-MK' : 'en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${releaseDate}T00:00:00Z`));
}
interface DownloadCopy {
  released: string;
  notes: string;
  install: string;
  requirements: Record<Platform, string>;
  steps: Record<Platform, string[]>;
  unspecified: string;
  security: string;
  source: string;
  checksum: string;
  bytes: string;
  mobile: string;
  unsupported: string;
  copy: string;
  share: string;
  pageLink: string;
  copied: string;
  shared: string;
  copyFailed: string;
}
export const downloadCopy: Localized<DownloadCopy> = {
  mk: {
    released: 'Објавено', notes: 'Белешки за ова издание', install: 'Инсталација и детали',
    requirements: {
      windows: 'Извозот за Windows е x86-64 (64-битен Intel/AMD). Издавачот не наведува минимална верзија на Windows.',
      mac: 'Извозот за macOS е Universal (Intel x86-64 и Apple Silicon arm64). Во поставките за извоз се наведени macOS 10.12 за Intel и macOS 11.0 за Apple Silicon; ова не е потврда дека играта е тестирана на тие верзии.',
    },
    steps: {
      windows: ['Преземи GrayZoneWin.zip.', 'Кликни со десното копче на ZIP-датотеката и избери „Extract All“ (Извлечи сè). Задржи ги сите извлечени датотеки во истата папка.', 'Отвори ја извлечената папка и стартувај ја апликацијата .exe, не од ZIP-архивата.'],
      mac: ['Преземи GrayZoneMac.zip и отвори ја ZIP-датотеката за да се извлече.', 'Премести ја извлечената апликација .app во Applications (Апликации), па отвори ја оттаму.'],
    },
    unspecified: 'Издавачот не наведува минимална RAM-меморија или потврдени, тестирани верзии на оперативните системи. За детали, погледни ги белешките за изданието или контактирај го тимот.',
    security: 'Ако оперативниот систем го блокира отворањето, прво провери го изворот и SHA-256 отпечатокот. Не исклучувај ги безбедносните заштити; побарај помош од авторите ако предупредувањето не ти е јасно.',
    source: 'Поставки за извоз на ова издание', checksum: 'SHA-256 на ZIP-архивите', bytes: 'бајти',
    mobile: 'Играта е само за Windows и macOS, не за телефон или таблет. Копирај или сподели ја страницата за да ја отвориш на компјутер.',
    unsupported: 'Достапни се само изданија за Windows и macOS. Нема издание за Linux; твојот уред не е препознаен како поддржан компјутер.',
    copy: 'Копирај линк', share: 'Сподели страница', pageLink: 'Линк до страницата', copied: 'Линкот е копиран.', shared: 'Линкот е споделен.', copyFailed: 'Не може автоматски да се копира. Избери го и копирај го линкот подолу.',
  },
  en: {
    released: 'Released', notes: 'Release notes for this version', install: 'Installation and details',
    requirements: {
      windows: 'The Windows export targets x86-64 (64-bit Intel/AMD). The publisher does not specify a minimum Windows version.',
      mac: 'The macOS export targets Universal (Intel x86-64 and Apple Silicon arm64). Its export settings declare macOS 10.12 for Intel and macOS 11.0 for Apple Silicon; these are not verified game-tested minimums.',
    },
    steps: {
      windows: ['Download GrayZoneWin.zip.', 'Right-click the ZIP file and choose “Extract All”. Keep all extracted files together in the same folder.', 'Open the extracted folder and launch the .exe application, not from inside the ZIP archive.'],
      mac: ['Download GrayZoneMac.zip and open the ZIP file to extract it.', 'Move the extracted .app application to Applications, then open it from there.'],
    },
    unspecified: 'The publisher has not specified minimum RAM or confirmed game-tested operating system versions. Check the release notes or contact the team for compatibility details.',
    security: 'If your operating system blocks opening the app, check the source and SHA-256 checksum first. Do not disable security protections; contact the authors if you do not understand the warning.',
    source: 'Export settings for this release', checksum: 'ZIP archive SHA-256 checksums', bytes: 'bytes',
    mobile: 'The game is for Windows and macOS only, not phones or tablets. Copy or share this page to open it on a computer.',
    unsupported: 'Only Windows and macOS builds are available. There is no Linux build; your device was not identified as a supported desktop.',
    copy: 'Copy link', share: 'Share page', pageLink: 'Page link', copied: 'Link copied.', shared: 'Link shared.', copyFailed: 'Automatic copying is unavailable. Select and copy the link below.',
  },
};
