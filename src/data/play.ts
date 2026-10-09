import type { Localized } from '../i18n/config';

export interface PlayCopy {
  title: string;
  lead: string;
  /** The ticket's own printing. */
  ticket: {
    kind: string;
    entry: string;
    admits: string;
    admitsValue: string;
    price: string;
    priceValue: string;
    version: string;
    languages: string;
    languagesValue: string;
    /** Before the platform's name on each stub: "Tear off for" Windows. */
    tear: string;
  };
  allReleases: string;
}

export const playCopy: Localized<PlayCopy> = {
  mk: {
    title: 'Твој потег',
    lead: 'Играта е бесплатна, без регистрација. Земи пропусница и влези во сивата зона.',
    ticket: {
      kind: 'Пропусница',
      entry: 'Влез во сивата зона',
      admits: 'Важи за',
      admitsValue: '1 играч',
      price: 'Цена',
      priceValue: 'Бесплатно',
      version: 'Верзија',
      languages: 'Јазици',
      languagesValue: 'MK · EN',
      tear: 'Откини за',
    },
    allReleases: 'Сите изданија на GitHub',
  },
  en: {
    title: 'Your move',
    lead: 'The game is free, no sign-up. Take a pass and step into the gray zone.',
    ticket: {
      kind: 'Pass',
      entry: 'Entry to the gray zone',
      admits: 'Admits',
      admitsValue: '1 player',
      price: 'Price',
      priceValue: 'Free',
      version: 'Version',
      languages: 'Languages',
      languagesValue: 'MK · EN',
      tear: 'Tear off for',
    },
    allReleases: 'All releases on GitHub',
  },
};
