export const locales = ['mk', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'mk';

/** A value provided once per locale. */
export type Localized<T> = Record<Locale, T>;

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (locales as readonly string[]).includes(value);
}

/** Absolute path to `path` (leading slash, no locale) in `locale`. MK is unprefixed. */
export function localePath(locale: Locale, path = '/'): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return locale === defaultLocale ? clean : `/${locale}${clean === '/' ? '/' : clean}`;
}

/** BCP-47 tag for <html lang> and Intl APIs. */
export const htmlLang: Localized<string> = { mk: 'mk', en: 'en' };
export const ogLocale: Localized<string> = { mk: 'mk_MK', en: 'en_US' };
