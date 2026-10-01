/**
 * JPEG and WebP copies of public/og-image.png, encoded at build time so the
 * PNG stays the single master. See src/lib/og.ts.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import sharp from 'sharp';
import { ogImageVariants, type DerivedOgExt } from '../lib/og';

type Pipeline = ReturnType<typeof sharp>;

const encoders: Record<DerivedOgExt, (img: Pipeline) => Pipeline> = {
  jpg: (img) => img.jpeg({ quality: 85, mozjpeg: true }),
  webp: (img) => img.webp({ quality: 82, effort: 6 }),
};

export const getStaticPaths = (() =>
  (Object.keys(encoders) as DerivedOgExt[]).map((ext) => ({ params: { ext } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const ext = params.ext as DerivedOgExt;
  const { type } = ogImageVariants.find((v) => v.ext === ext)!;
  // Relative to the project root, where `astro build` / `astro dev` run.
  const body = await encoders[ext](sharp('public/og-image.png')).toBuffer();
  return new Response(new Uint8Array(body), { headers: { 'Content-Type': type } });
};
