import type { Localized } from '../i18n/config';

export const contact: Localized<{ title: string; text: string }> = {
  en: {
    title: 'Get in Touch!',
    text: 'We always appreciate your honest feedback on our projects. Feel free to send us an email with your ideas!',
  },
  mk: {
    title: 'Контактирај Нѐ!',
    text: 'Имаш прашање, предлог или идеја за подобрување на „Сива Зона“? Нашиот тим секогаш е отворен за соработка и нови иницијативи. Пиши ни – твоето мислење ни значи.',
  },
};

export const footer: Localized<{ rights: string }> = {
  en: { rights: '© 2025 GrayZone. All rights reserved.' },
  mk: { rights: '© 2025 Сива Зона. Сите права задржани.' },
};
