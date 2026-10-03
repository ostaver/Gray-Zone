import type { Localized } from './config';

const mk = {
  meta: {
    title: 'Сива Зона',
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
    lead: 'Стипендија во странство. Краток рок. Секој чекор е избор, дали ќе го задржиш интегритетот?',
    honest: 'Бела зона',
    gray: 'Црна зона',
    facts: ['Репутација', 'Интелигенција', 'Интегритет'],
    cta: 'Преземи бесплатно',
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
    title: 'Gray Zone',
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
    lead: 'A scholarship abroad. A tight deadline. Every step is a choice, will you save your integrity?',
    honest: 'White zone',
    gray: 'Black zone',
    facts: ['Reputation', 'Intelligence', 'Integrity'],
    cta: 'Download free',
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
