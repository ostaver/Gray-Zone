// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://sivazona.mk',
  trailingSlash: 'ignore',
  i18n: {
    locales: ['mk', 'en'],
    defaultLocale: 'mk',
    routing: { prefixDefaultLocale: false },
  },
  image: {
    responsiveStyles: true,
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
