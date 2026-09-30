import type { Localized } from './config';

const mk = {
  meta: {
    title: 'Сива Зона — Едукативна игра за средношколци',
    description:
      'Бесплатна едукативна игра за Windows и macOS за интегритет и антикорупција. Секој избор остава трага — чесниот пат или кратенката низ сивата зона.',
    siteName: 'Сива Зона',
  },
  a11y: {
    skip: 'Прескокни до содржината',
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
  },
  hero: {
    title: ['Сива', 'Зона'],
    eyebrow: 'Едукативна игра за средношколци',
    lead: 'Стипендија во странство. Краток рок. Секој чекор е избор — чесниот пат или кратенката низ сивата зона.',
    honest: 'Чесен пат',
    gray: 'Сива зона',
    currency: 'ден.',
    mark: 'Секој избор остава трага.',
    facts: ['Бесплатно', 'Windows · macOS', 'Финансирано од ЕУ'],
    stats: { integrity: 'Интегритет', reputation: 'Репутација', time: 'Време', money: 'Пари' },
    cta: 'Преземи бесплатно',
    ctaFor: 'за',
    secondary: 'Како се игра',
    scroll: 'Скролај — влези во сивата зона',
    cursor: 'Избери',
  },
  download: {
    title: 'Избери платформа',
    windows: 'Преземи за Windows',
    mac: 'Преземи за macOS',
    macNote: 'На macOS можеби ќе треба првпат десен клик → Open и дозвола преку Gatekeeper.',
    version: 'Верзија',
    size: 'ZIP архива',
    desktopOnly: 'Играта е за компјутер — отвори ја оваа страница на Windows или macOS.',
    detected: 'Препорачано за твојот уред',
  },
};

export type UIDict = typeof mk;

const en: UIDict = {
  meta: {
    title: 'Gray Zone — An educational game for high-schoolers',
    description:
      'A free educational game for Windows and macOS about integrity and anti-corruption. Every choice leaves a mark — the honest path, or a shortcut through the gray zone.',
    siteName: 'Gray Zone',
  },
  a11y: {
    skip: 'Skip to content',
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
  },
  hero: {
    title: ['Gray', 'Zone'],
    eyebrow: 'An educational game for high-schoolers',
    lead: 'A scholarship abroad. A tight deadline. Every step is a choice — the honest path, or a shortcut through the gray zone.',
    honest: 'Honest path',
    gray: 'Gray zone',
    mark: 'Every choice leaves a mark.',
    facts: ['Free', 'Windows · macOS', 'Funded by the EU'],
    currency: 'MKD',
    stats: { integrity: 'Integrity', reputation: 'Reputation', time: 'Time', money: 'Money' },
    cta: 'Download free',
    ctaFor: 'for',
    secondary: 'How to play',
    scroll: 'Scroll — enter the gray zone',
    cursor: 'Choose',
  },
  download: {
    title: 'Choose your platform',
    windows: 'Download for Windows',
    mac: 'Download for macOS',
    macNote: 'On macOS, you may need to right-click → Open the first time and allow Gatekeeper.',
    version: 'Version',
    size: 'ZIP archive',
    desktopOnly: 'The game runs on computers — open this page on Windows or macOS.',
    detected: 'Recommended for your device',
  },
};

export const ui: Localized<UIDict> = { mk, en };
