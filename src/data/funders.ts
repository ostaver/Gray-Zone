import type { ImageMetadata } from 'astro';
import type { Localized } from '../i18n/config';
import fundersSrc from '../assets/brand/funders.png';

export const fundersImage: ImageMetadata = fundersSrc;

export const funders: Localized<{ alt: string; disclaimer: string }> = {
  en: {
    alt: 'Funded by the European Union; EU with YOU; SELDI.net; Youth Council – Prilep',
    disclaimer:
      'Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union. Neither the European Union nor the granting authority can be held responsible for them.',
  },
  mk: {
    alt: 'Финансирано од Европската Унија; EU with YOU; SELDI.net; Младински совет – Прилеп',
    disclaimer:
      'Финансирано од Европската Унија. Изнесените ставови и мислења се, сепак, исклучиво на авторот(ите) и не мора да ги одразуваат ставовите на Европската Унија. Ниту Европската Унија ниту органот што го доделува грантот не можат да бидат одговорни за нив.',
  },
};
