import type { APIRoute } from 'astro';

/** Everything may be crawled; the sitemap lists the two language versions. */
export const GET: APIRoute = ({ site }) =>
  new Response(`# OSTAVER: The intersection of Art and Abstract Expression\n\nUser-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
