import type { Localized } from '../i18n/config';

export type ContactChannel = 'email' | 'instagram' | 'github';

export interface ContactCopy {
  title: string;
  text: string;
  /** Names each channel in the list. */
  channels: Record<ContactChannel, string>;
  /** Shown for the GitHub channel in place of its address. */
  source: string;
  /** The button beside the address, and the stamp that lands once it's on the clipboard. */
  copy: string;
  copied: string;
}

export const contactCopy: Localized<ContactCopy> = {
  en: {
    title: 'Get in Touch!',
    text: 'We always appreciate your honest feedback on our projects. Feel free to send us an email with your ideas!',
    channels: { email: 'Email', instagram: 'Instagram', github: 'GitHub' },
    source: 'Source code',
    copy: 'Copy address',
    copied: 'Copied',
  },
  mk: {
    title: 'Контактирај Нѐ!',
    text: 'Имаш прашање, предлог или идеја за подобрување на „Сива Зона“? Нашиот тим секогаш е отворен за соработка и нови иницијативи. Пиши ни – твоето мислење ни значи.',
    channels: { email: 'Е-пошта', instagram: 'Instagram', github: 'GitHub' },
    source: 'Изворен код',
    copy: 'Копирај адреса',
    copied: 'Копирано',
  },
};

export interface FooterCopy {
  rights: string;
}

export const footerCopy: Localized<FooterCopy> = {
  en: { rights: '© 2025 GrayZone. All rights reserved.' },
  mk: { rights: '© 2025 Сива Зона. Сите права задржани.' },
};
