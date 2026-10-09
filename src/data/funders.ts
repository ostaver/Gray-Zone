import type { ImageMetadata } from 'astro';
import type { Localized } from '../i18n/config';
import eu from '../assets/brand/funders/eu.png';
import euWithYou from '../assets/brand/funders/eu-with-you.png';
import seldi from '../assets/brand/funders/seldi.png';
import youthCouncil from '../assets/brand/funders/youth-council.png';

/** The funders' and partners' logos, in the order they are credited, each set at the same height. */
export const funderLogos: { image: ImageMetadata; name: Localized<string> }[] = [
  { image: eu, name: { en: 'Funded by the European Union', mk: 'Финансирано од Европската Унија' } },
  { image: euWithYou, name: { en: 'EU with YOU', mk: 'EU with YOU' } },
  { image: seldi, name: { en: 'SELDI.net', mk: 'SELDI.net' } },
  { image: youthCouncil, name: { en: 'Youth Council – Prilep', mk: 'Младински совет – Прилеп' } },
];

export const funders: Localized<{ label: string; disclaimer: string }> = {
  en: {
    label: 'Funders and partners',
    disclaimer:
      'Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union. Neither the European Union nor the granting authority can be held responsible for them.',
  },
  mk: {
    label: 'Финансиери и партнери',
    disclaimer:
      'Финансирано од Европската Унија. Изнесените ставови и мислења се, сепак, исклучиво на авторот(ите) и не мора да ги одразуваат ставовите на Европската Унија. Ниту Европската Унија ниту органот што го доделува грантот не можат да бидат одговорни за нив.',
  },
};
