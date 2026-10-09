import type { Localized } from './config';

const mk = {
  meta: {
    title: 'Сива Зона',
    description:
      'Бесплатна едукативна игра за Windows и macOS за интегритет и антикорупција. Секој избор остава трага — чесниот пат или кратенката низ сивата зона.',
    siteName: 'Сива Зона',
    imageAlt: 'Логото на „Сива Зона“, поделено со скинат раб на црвена и темна половина.',
  },
  a11y: {
    skipToContent: 'Прескокни до содржината',
    langSwitch: 'Јазик',
    close: 'Затвори',
  },
  nav: {
    about: 'За играта',
    gallery: 'Галерија',
    tutorial: 'Упатство',
    team: 'Тим',
    contact: 'Контакт',
    download: 'Преземи',
    label: 'Главна навигација',
    menu: 'Мени',
    platforms: 'Windows · macOS',
  },
  hero: {
    title: ['Сива', 'Зона'],
    description: 'Бесплатна едукативна игра за корупција, избори и интегритет.',
    lead: 'Стипендија во странство. Краток рок. Секој избор остава трага.',
    honest: 'Бела зона',
    gray: 'Црна зона',
    facts: ['Интегритет', 'Репутација', 'Време', 'Пари'],
    cta: 'Преземи бесплатно',
    appearance: 'Изглед на страницата',
  },
  download: {
    title: 'Избери платформа',
    windows: 'Преземи за Windows',
    mac: 'Преземи за macOS',
    platforms: { windows: 'Windows', mac: 'macOS' },
    version: 'Верзија',
    detected: 'Препорачано за твојот уред',
  },
};

export type UIDict = typeof mk;

const en: UIDict = {
  meta: {
    title: 'Gray Zone',
    description:
      'A free educational game for Windows and macOS about integrity and anti-corruption. Every choice leaves a mark — the honest path, or a shortcut through the gray zone.',
    siteName: 'Gray Zone',
    imageAlt: 'The Gray Zone logo, divided by a torn edge into red and dark halves.',
  },
  a11y: {
    skipToContent: 'Skip to content',
    langSwitch: 'Language',
    close: 'Close',
  },
  nav: {
    about: 'About',
    gallery: 'Gallery',
    tutorial: 'How to play',
    team: 'Team',
    contact: 'Contact',
    download: 'Download',
    label: 'Main navigation',
    menu: 'Menu',
    platforms: 'Windows · macOS',
  },
  hero: {
    title: ['Gray', 'Zone'],
    description: 'A free educational game about corruption, choices, and integrity.',
    lead: 'A scholarship abroad. A tight deadline. Every choice leaves a mark.',
    honest: 'White zone',
    gray: 'Black zone',
    facts: ['Integrity', 'Reputation', 'Time', 'Money'],
    cta: 'Download free',
    appearance: 'Page appearance',
  },
  download: {
    title: 'Choose your platform',
    windows: 'Download for Windows',
    mac: 'Download for macOS',
    platforms: { windows: 'Windows', mac: 'macOS' },
    version: 'Version',
    detected: 'Recommended for your device',
  },
};

export const ui: Localized<UIDict> = { mk, en };
