/**
 * Link-preview image. `public/og-image.png` is the master; src/pages/og-image.[ext].ts derives
 * the lighter JPEG and WebP copies at build time. Pages advertise only `ogImage`: the JPEG
 * (~165KB) fits every crawler's limit, while the ~1MB PNG is over what Instagram and WhatsApp
 * fetch, and LinkedIn picks unpredictably when several og:image tags are present.
 */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export const ogImageVariants = [
  { ext: 'jpg', type: 'image/jpeg' },
  { ext: 'png', type: 'image/png' },
  { ext: 'webp', type: 'image/webp' },
] as const;

export const ogImage = ogImageVariants[0];

export type OgExt = (typeof ogImageVariants)[number]['ext'];
export type DerivedOgExt = Exclude<OgExt, 'png'>;

export const ogImagePath = (ext: OgExt) => `/og-image.${ext}`;
