# Sivazona MK (Gray Zone)

![Sivazona MK](public/og-image.png)

Marketing site for **Сива Зона** aka **Gray Zone**, served at <https://sivazona.mk>. Bilingual (Macedonian default, English under `/en`), single-page, with a WebGL hero and a preloader that transitions into it.

## Stack

- **Astro 7**, static output (`astro build` → `dist/`)
- **TypeScript** (strict, via `astro check`)
- **GSAP** (+ ScrollTrigger, SplitText, etc.) and **Lenis** for motion and smooth scroll
- **OGL** + custom GLSL for the hero field and preloader/seam effects
- Fonts via `@fontsource` (Inter Tight, JetBrains Mono, Oswald)
- Astro i18n routing: `mk` (default, no prefix) and `en` (`/en`)

Requires **Node >= 22.12**.

## Deployment

Hosted on **Cloudflare** as a static site (Cloudflare Pages / static assets). The build output is the `dist/` directory; there is no server runtime. Production domain: `sivazona.mk`.

- Build command: `npm run build`
- Output directory: `dist`
- Node version: 22+

The Cloudflare project settings live in the Cloudflare dashboard; there is no `wrangler` config in this repo.

## Getting started

```bash
npm install
npm run dev
```

The dev server runs at <http://localhost:4321>.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run check` | Type-check Astro and TypeScript files |

## Project layout

```
src/
  pages/        Routes (index.astro = mk, en/index.astro = en)
  views/        Page-level compositions (HomePage.astro)
  layouts/      Base HTML shell
  components/   hero/, shell/ (preloader), ui/
  data/         Content: team, gallery, funders, links, tutorial, about, contact
  i18n/         Locale config and UI strings
  lib/          gl/ (WebGL stage, shaders), canvas/, motion/ (gsap, lenis), lifecycle, og.ts (share-image variants)
  styles/       tokens.css, global.css
  assets/       Optimised images (brand, gallery, team, tutorial per locale)
public/         Static files copied as-is (favicons, og-image.png)
```

## Share image

`public/og-image.png` (1200×630) is the master and the default `og:image` / `twitter:image`. `src/pages/og-image.[ext].ts` encodes `/og-image.jpg` and `/og-image.webp` from it at build time (sharp), and `Base.astro` lists all three as `og:image` entries, PNG first. Replace only the PNG; the other formats follow on the next build.

See [AGENTS.md](AGENTS.md) for conventions for AI coding agents.
