import type { Localized } from '../i18n/config';

export type ContactChannel = 'email' | 'instagram' | 'github' | 'issues';

export interface ContactCopy {
  title: string;
  text: string;
  /** Names each channel in the list. */
  channels: Record<ContactChannel, string>;
  /** Shown for the GitHub channel in place of its address. */
  source: string;
  bugReport: string;
  /** The button beside the address, and the word its face flips to once it's on the clipboard. */
  copy: string;
  copied: string;
}

export const contactCopy: Localized<ContactCopy> = {
  en: {
    title: 'Get in Touch!',
    text: 'Share feedback, ask about using Gray Zone in your classroom, or discuss a collaboration. For a game bug, open a GitHub report with your operating system, game version, and steps to reproduce it. Reports are public; do not include personal information.',
    channels: { email: 'Email', instagram: 'Instagram', github: 'GitHub', issues: 'Game support' },
    source: 'Source code',
    bugReport: 'Report a bug',
    copy: 'Copy address',
    copied: 'Copied',
  },
  mk: {
    title: 'Контактирај Нѐ!',
    text: 'Сподели мислење, прашај за користење на „Сива Зона“ во училница или предложи соработка. За грешка во играта, отвори пријава на GitHub со оперативниот систем, верзијата на играта и чекорите за повторување на проблемот. Пријавите се јавни; не внесувај лични податоци.',
    channels: { email: 'Е-пошта', instagram: 'Instagram', github: 'GitHub', issues: 'Поддршка за играта' },
    source: 'Изворен код',
    bugReport: 'Пријави грешка',
    copy: 'Копирај адреса',
    copied: 'Копирано',
  },
};

export interface FooterCopy {
  rights: string;
  explore: string;
  game: string;
  follow: string;
  language: string;
  releaseNotes: string;
}

const copyrightYear = new Date().getFullYear();

export const footerCopy: Localized<FooterCopy> = {
  en: {
    rights: `© ${copyrightYear} Gray Zone. All rights reserved.`,
    explore: 'Explore',
    game: 'The game',
    follow: 'Follow',
    language: 'Language',
    releaseNotes: 'Release notes',
  },
  mk: {
    rights: `© ${copyrightYear} Сива Зона. Сите права задржани.`,
    explore: 'Истражи',
    game: 'Играта',
    follow: 'Следи нѐ',
    language: 'Јазик',
    releaseNotes: 'Белешки за верзијата',
  },
};
