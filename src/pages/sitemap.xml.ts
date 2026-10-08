import type { APIRoute } from 'astro';
import { htmlLang, localePath, locales } from '../i18n/config';

/**
 * The site is one page in two languages, so the sitemap is written out here rather than through
 * an integration: each language's URL, with the other as its alternate.
 */
export const GET: APIRoute = ({ site }) => {
  const url = (l: (typeof locales)[number]) => new URL(localePath(l), site).href;
  const alternates = locales.map((l) => `    <xhtml:link rel="alternate" hreflang="${htmlLang[l]}" href="${url(l)}"/>`).join('\n');
  const entries = locales.map((l) => `  <url>\n    <loc>${url(l)}</loc>\n${alternates}\n  </url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
