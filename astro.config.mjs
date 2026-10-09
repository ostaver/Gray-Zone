// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Absolute metadata URLs must match the deployed host; sivazona.mk still serves the legacy site.
  site: 'https://siva-zona.ostaver.com',
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
  vite: {
    // Prebundle every client dep at dev-server start. Otherwise Vite discovers them on the
    // first page load, re-optimizes mid-request and aborts the in-flight module imports.
    optimizeDeps: {
      include: [
        'gsap',
        'gsap/ScrollTrigger',
        'gsap/SplitText',
        'gsap/ScrambleTextPlugin',
        'gsap/DrawSVGPlugin',
        'gsap/CustomEase',
        'lenis',
        'ogl',
      ],
    },
  },
});
