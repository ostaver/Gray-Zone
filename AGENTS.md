# AGENTS.md

Guidance for AI coding agents working in this repo. See [README.md](README.md) for the stack, deployment and setup.

## Commands

- `npm install` — install deps (Node >= 22.12)
- `npm run dev` — dev server on localhost:4321
- `npm run check` — type check; run before finishing any change
- `npm run build` — production build; must pass before finishing

There is no test suite. Verify changes with `npm run check`, `npm run build`, and by looking at the page in a browser (dev server) for visual or motion work.

## Architecture

- Astro static site, two locales: `mk` (default, unprefixed) and `en` (`/en`). Both routes render the shared view in `src/views/HomePage.astro`.
- **All user-facing copy and content go through `src/i18n/ui.ts` and `src/data/*.ts`**, never hard-coded in components. Any new string needs both `mk` and `en`.
- Locale-specific images live in `src/assets/<name>/{mk,en}/`.
- Design tokens (colours, spacing, type) are in `src/styles/tokens.css`; use them instead of literal values.
- Client scripts: GSAP/ScrollTrigger/Lenis are set up in `src/lib/motion/`; import GSAP plugins from there rather than directly. Cleanup of listeners/tickers goes through `src/lib/lifecycle.ts`.
- WebGL (OGL) lives in `src/lib/gl/` (shared stage, GLSL in `shaders/`, per-effect code in `views/`). Preloader logo dots use `src/lib/canvas/logoParticles.ts`.
- New third-party client deps used in the browser must be added to `vite.optimizeDeps.include` in `astro.config.mjs`.

## Performance rules - Ignore for now

This site has been tuned to hold 60fps on integrated GPUs. Do not regress it:

- Animate only `transform` and `opacity` on the compositor; avoid animating layout properties or filters.
- Keep WebGL work batched and dispose GL resources and tickers when views tear down.
- Prefer static layers (e.g. the halftone title layer) over per-frame redraws.
- Check changes to the preloader/hero transition for dropped frames.

## Conventions

- TypeScript, strict. No `any` without a reason.
- Match surrounding code style and comment density; comments explain why, not what.
- Commits use conventional-style prefixes seen in history: `feat(scope):`, `perf(scope):`, `fix(scope):`.
- **"Back to top" buttons are prohibited**, and specifically in the footer (`src/components/shell/Footer.astro`): its bar holds only the rights line and the version. Do not add one there or anywhere else (e.g. a floating button).
- Do not commit `dist/`, `.astro/`, `node_modules/`, or `.env*`. `/Chromatic theme/` is a local design reference and is git-ignored; do not add it.

## Deployment

Static site (build output `dist/`). No CI/CD pipeline, no server code — do not add server-side features (API routes, SSR adapters) without asking.

## Branches

Work is organised in phase branches (`phase-01-hero`, `phase-02-nav`, ...) cut from `main` and merged back into `main` via PR.

`LEGACY/GrayZone` is an unrelated (orphan) branch holding only the pre-Astro legacy site at its root. Never merge it into or from the other branches.
