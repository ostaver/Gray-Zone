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

Static site deployed directly from the `dist/` directory; there is no server runtime or CI/CD pipeline.

- Build command: `npm run build`
- Output directory: `dist`
- Node version: 22+

Upload or serve the contents of `dist/` to any static web host.

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
  components/   hero/, about/, story/, shell/ (preloader, nav), ui/
  data/         Content: team, gallery, funders, links, tutorial, about, contact; sections (page order)
  i18n/         Locale config and UI strings
  lib/          gl/ (WebGL stage, shaders), canvas/, motion/ (gsap, lenis), zone.ts (shared zone switch), lifecycle, og.ts (share-image variants)
  styles/       tokens.css, global.css
  assets/       Optimised images (brand, gallery, team, tutorial per locale)
public/         Static files copied as-is (favicons, og-image.png)
```

## Zone appearance

The hero's **White zone** and **Black zone** labels and the nav's split-disc button are keyboard-accessible theme controls in both locales. White zone switches the page and download dialog to light surfaces with dark text, retaining the red CTA accents and red half of the WebGL dot field. The neutral half uses darker dots for contrast on white. Black zone restores the original dark/red palette. Both modes retain the cursor lens, moving seam, and chromatic split; only hovering the theme buttons pauses the seam's pointer target so they remain easy to click. The hero buttons expose the selection with `aria-pressed`; the nav disc is a toggle (`aria-pressed` = white zone) that turns over as the zone changes. The DOM shader fallback follows the same selection.

Black zone is the default on every page load. CSS palettes live in `src/styles/tokens.css`. Every control switches through `setZone` in `src/lib/zone.ts`, which runs the transition and notifies subscribers; `hero.ts` subscribes and passes the selection to the shader through `SeamHalftoneState.whiteZone`.

Theme changes bloom outward from the selected button over 1.3 seconds, with a soft halftone fringe and a subtle settling zoom. Native View Transitions reveal the new page palette without cloning its DOM or WebGL context; the shared stage redraws synchronously for capture. Browsers without the required snapshot/mask support get an expanding paper/ink veil with a red dot rim, then a fade to the live page. Reduced motion skips the effect. Theme controls retain keyboard focus and temporarily expose `aria-disabled` while switching; repeated selections do not restart the animation.

## Navigation

`src/components/shell/Nav.astro` (+ `nav.ts`) is a fixed bar: logo disc and wordmark, the section links, the zone disc, the language switch and, once the hero's own CTA has scrolled away, a compact download button that opens the download dialog.

- **Seam index (≥ 1180px).** A small copy of the hero's tear runs through the row of links. Links left of it are solid; links right of it stay gray. It follows the reader, passing through each section's link while that section is read, and reaches the end of the row at the bottom of the page. Hovering pulls it to the pointer and keyboard focus pulls it to the focused link. The current section's links get `aria-current`.
- **Menu (< 1180px).** The links move into a full-screen sheet that drops from the top with a torn bottom edge. It has hollow display type that tears solid on hover/focus and for the current section, plus language, contact, version and the download CTA. While it is open, `#main` is inert and scroll is locked; Escape closes it. On these layouts the bar hides while scrolling down and returns when scrolling up.
- **Plate.** Over the hero the bar has no background of its own. Once the hero has passed, a blurred strip of the page surface with a torn edge slides in behind it.

In-page links scroll with Lenis and move focus to the target section. Sections are listed once in `src/data/sections.ts` (ids = anchors = `ui.nav` keys). Until each phase lands, `HomePage.astro` renders a `SectionPlaceholder` per id so the anchors and seam index have something to track. Replace each placeholder with the real section in its phase.

## About

`src/components/about/About.astro` (+ `about.ts`, `trade.ts`) is the first section. Copy lives in `src/data/about.ts`. There are no section numbers or count-ups anywhere; motion comes from the tear and the halftone.

- **Manifesto.** A large statement read across the tear: each word is gray type with a solid copy that rips across it as the reader reaches it (scrubbed, transforms only, the menu's tear technique). Runs marked `hollow` stay hollow display type like the hero's gray half; `red` runs tear in integrity red.
- **Logo orb.** The logo disc printed in halftone dots by the shared WebGL stage (`src/lib/gl/views/logoOrb.ts`, `logo-orb.frag.glsl`, reusing the hero's noise field pass). The wordmark is drawn to a canvas texture once Oswald's Cyrillic subset has loaded, split across the tear like the logo, and the dark half is solid ink so it reads in both zones. The disc turns as its column scrolls by and dots swell under the pointer. On desktop it rides sticky beside the copy. Without WebGL the real logo image stands in.
- **Copy.** Title, paragraphs and goals print in through a halftone screen (`print()` in `src/lib/motion/reveal.ts`, mask on `[data-printing]` in `global.css`): a sweeping front with a dot fringe ahead of it. Goals are marked with small torn lines (`src/lib/torn.ts`).
- **The trade (stats).** A pinned scene, two screens of scroll, drawn as one batch of dots (`src/lib/gl/views/dotBatch.ts`). Scrolling is a run of shortcuts: the gray zone's torn front eats the dot-matrix word INTEGRITY from the right, its dots tremble, break off and arc down into a growing heap of coins (money). Eyes open one by one and follow the front, or your pointer (reputation). A flip-dot clock runs throughout and races when you scroll fast (time). Every chip's path is a pure function of scroll progress, so scrolling back reverses it. DOM text carries each stat's name and caption; without WebGL the word and clock are set as type.

Reduced motion shows the statement fully torn, the copy in place, and one still frame of the trade, unpinned.

## Story

`src/components/story/Story.astro` (+ `story.ts`) follows About, with no nav entry of its own (the seam index counts it as About). Copy and steps live in `src/data/story.ts`.

A pad of four forms, pinned for one screen each: birth certificate, the secretary's confirmation, the English test, the interview. Each form has an honest box and a shortcut box either side of a torn line (real radio inputs). Ticking one draws the tick and signs the form; a shortcut also blooms a gray halftone stain into the paper. Scrolling (or a pointer tick, which scrolls for you) tugs the top sheet and throws it off-screen, alternating sides. Under the pad lies the scholarship decision: a summary of your four choices and a rubber stamp that slams down when it's uncovered. No shortcuts → approved, earned honestly; one or two → approved, with marks; three or more → rejected (`verdictFor`). Changing a tick on the way back up re-decides.

Reduced motion lays the forms out in a column with the decision last, stamped and live. Without JS the forms still tick and stain (`:has()`), and the decision lists all three outcomes.

## Share image

`public/og-image.png` (1200×630) is the master and the default `og:image` / `twitter:image`. `src/pages/og-image.[ext].ts` encodes `/og-image.jpg` and `/og-image.webp` from it at build time (sharp), and `Base.astro` lists all three as `og:image` entries, PNG first. Replace only the PNG; the other formats follow on the next build.

See [AGENTS.md](AGENTS.md) for conventions for AI coding agents.
