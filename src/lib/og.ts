/**
 * Link-preview image. `public/og-image.png` is the master and the default card;
 * src/pages/og-image.[ext].ts derives the lighter JPEG and WebP copies at build time.
 * Order matters: crawlers take the first og:image they understand.
 */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export const ogImageVariants = [
  { ext: 'png', type: 'image/png' },
  { ext: 'jpg', type: 'image/jpeg' },
  { ext: 'webp', type: 'image/webp' },
] as const;

export type OgExt = (typeof ogImageVariants)[number]['ext'];
export type DerivedOgExt = Exclude<OgExt, 'png'>;

export const ogImagePath = (ext: OgExt) => `/og-image.${ext}`;
