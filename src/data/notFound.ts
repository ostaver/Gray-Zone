import type { Localized } from '../i18n/config';

/**
 * The 404 page. A missing page can't tell which language the reader came in, so it carries both:
 * a slip from the archive's counter, in Macedonian and English.
 */
export interface NotFoundCopy {
  /** The slip's printed form name. */
  doc: string;
  title: string;
  text: string;
  /** Stamped across the slip. */
  stamp: string;
  home: string;
}

export const notFoundCopy: Localized<NotFoundCopy> = {
  mk: {
    doc: 'Барање бр. 404',
    title: 'Овој шалтер не постои',
    text: 'Документот што го бараш го нема во архивата. Можеби се загубил, а можеби никогаш и не постоел.',
    stamp: 'Не е пронајдено',
    home: 'Назад на почетна',
  },
  en: {
    doc: 'Request no. 404',
    title: 'This counter doesn’t exist',
    text: 'The document you’re after isn’t in the archive. Maybe it got lost, maybe it never existed.',
    stamp: 'Not found',
    home: 'Back to the start',
  },
};
