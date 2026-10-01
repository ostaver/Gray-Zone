# Design Review — Sivazona MK (Gray Zone), phase-01 hero

**Mode:** `/design review` · **Date:** 2026-10-01 · **Branch:** `phase-00-foundation` (with `phase-01-hero` merged) · **Surface:** preloader + hero + download modal, both locales (`/` mk, `/en`)

**Overall: 39 / 50 — Needs changes** (one HIGH standing)

---

## TL;DR

This is a hero with a real concept, executed with unusual engineering discipline. The torn seam is one model feeding the WebGL halftone field, the DOM clip-paths on the headline, and the game-HUD values — the signature visual is the product's actual meaning (honest path vs. gray zone), not decoration bolted on. The preloader-to-hero handover (logo's own dot grid becomes the progress bar, logo spins through its tear, hero seam develops from center) was verified working on the production build. The accessibility floor is genuinely high: skip link, visible focus rings, native dialog semantics, a complete reduced-motion path, and a clean axe audit (0 violations).

The phase's debts, in order: the primary CTA is unreachable on landscape phones (clipped out of the pinned hero, and scrolling fades it rather than revealing it); the secondary CTA ("Како се игра") is a dead link until the tutorial section exists; social shares have no image (`og:image` missing while `twitter:card` promises a large one); the preloader's signature transition degrades silently when its logo image fails, leaving GSAP warnings on the console.

**Primary recommendation:** run `/design responsive` for the landscape/short-viewport recomposition first — it is the only finding that blocks the primary action on a class of real devices.

---

## Heuristic scores

| # | Lens | Score | Key finding |
|---|---|---|---|
| 1 | First impression | 9/10 | Arrival is near-perfect craft: preloader → logo-through-the-tear → seam reveal. The scroll narrative then dead-ends into a blank page (sections not built yet — phase artifact, not a design error). |
| 2 | Hierarchy | 8/10 | Title dominates at 21vw; eyebrow → mark, HUD, lead, CTA read in the right order; squint test passes (title, red CTA, red dot). Bottom row carries four competing groups; the 10px HUD labels recede too far on mobile. |
| 3 | Color voice | 8/10 | Palette derived from the logo (integrity red, paper, ash on ink); red is rationed to the CTA and status accents; the gray-zone half is genuinely desaturated. No generic tech hue anywhere. |
| 4 | Type voice | 7/10 | Oswald condensed display + mono HUD labels + Cormorant italic mark is a confident, game-native system; Cyrillic renders correctly in all faces. Labels at 10px (8px on mobile HUD) sit below the legibility floor. |
| 5 | Interaction feel | 7/10 | Seam follows the pointer, HUD responds to seam position, magnetic CTA, platform-detected modal, full keyboard path verified. Costs: one dead control, CTAs clipped in landscape, an unused `data-cursor` affordance. |

---

## Findings

Ordered by severity, then reach.

| # | Severity | Discipline | Location | Before | After | Why |
|---|---|---|---|---|---|---|
| 1 | HIGH | Layout | `src/components/hero/Hero.astro:97-106` | The pin is `100svh` with `overflow: clip`. Measured at 740×360 (landscape phone): primary CTA occupies y 385–441, ghost CTA 397–429 — both fully below the 360px clip. No CTA is visible or reachable; scrolling does not recover them (the pin is sticky and the bottom row fades out by 40% scroll progress). At 320×700 portrait everything fits (ghost bottom 684px, 16px margin). | At short viewports (roughly `max-height: 500px`), recompose the pin: clamp the title harder against `svh`, collapse the HUD to one row (or two stats), halve the vertical paddings — or let the pin's content scroll before pinning begins. | The primary conversion action is cut off and out of reach on a class of real devices. Escalation trigger: content out of reach once the viewport changes shape. |
| 2 | MEDIUM | Interaction | `src/components/hero/Hero.astro:80`, `src/components/hero/hero.ts:207-214` | "Како се игра" links to `#tutorial`; no such section exists in this phase. Verified by click: the hash changes, `scrollY` stays 0, nothing happens. The smooth-scroll guard silently falls through to a dead anchor. | Until the tutorial section ships, point the ghost CTA at something real (the GitHub repo's README, a stub section, or hide the control). | A styled, underlined control that silently does nothing misleads. Acceptable mid-build on a phase branch; must be resolved before merge/ship. |
| 3 | MEDIUM | Surface | `src/layouts/Base.astro:38-44` | Full Open Graph set (`og:type/title/description/url/locale`) and `twitter:card=summary_large_image`, but no `og:image` or `twitter:image` URL. | Ship a 1200×630 share image (the torn headline over the two dot fields is the natural shot) and add both meta tags for each locale. | A marketing site for a free game lives on shares; the declared large card renders cardless. |
| 4 | MEDIUM | Interaction | `src/components/shell/Preloader.astro:53-56, 111-112` | When the logo image fails to load (observed live: dev `/_image` endpoint 500), `img.decode()` errors are swallowed, `dots` becomes null, and the exit tweens target `dots ?? {}` — GSAP logs "Invalid property rotation/zoom … Missing plugin?" on every degraded run, and the logo-through-the-tear handover silently degrades to a plain fade. Production (static asset) is clean. | Log the decode failure; define the rotation/zoom tweens only when `dots` exists (or tween a stub object that declares those fields). | The signature transition fails invisibly, with console noise, on exactly the devices/networks that need the fallback. |
| 5 | MEDIUM | Type | `src/components/hero/Hero.astro:192, 280, 317`, mobile block `:453-459`; `src/components/ui/DownloadModal.astro:221` | HUD `dt`, facts, side tags, and the modal badge render at `0.625rem` (10px); the mobile HUD `dt` drops to `0.5rem` (8px) with `0.12em` tracking. | Floor the labels at `0.6875rem` (11px) and the mobile HUD `dt` at `0.625rem`; keep the HUD voice through tracking and case, not size. | 8–10px uppercase mono is below comfortable legibility on the layer users actually read for proof (free, platforms, EU-funded). |
| 6 | LOW | Voice | `src/components/hero/Hero.astro:14`, `src/styles/tokens.css:35`, `src/i18n/ui.ts:37, 87` | `data-cursor="Избери"/"Choose"`, the `--z-cursor` token, and two localized strings exist; nothing consumes them. | Remove all three until the custom-cursor phase, or build the cursor. | Dead affordance code invites drift between the i18n dictionary and reality. |
| 7 | LOW | Interaction | `src/components/hero/Hero.astro:75`, `src/components/ui/DownloadModal.astro:15` | The primary CTA is `href="#download"` but no element carries `id="download"`; with JS disabled, the main action navigates to a nonexistent hash. | Link directly to the GitHub releases URL (JS still intercepts to open the modal), or give the modal a no-JS target. | No-JS visitors get a dead primary action on a static site. |
| 8 | LOW | Motion | `src/components/shell/Preloader.astro:72` | First visit per session: a 2s minimum preloader plus ~2.6s exit — roughly 3.5s before hero content appears. Returning visits in the same session: ~1.3s. | Trim the full-mode minimum to ~1.2–1.5s; the bar's glide survives, the gate shrinks. | Cinematic pacing bought with attention; bounded and session-cached, so low. |

---

## Considered but rejected

| Location | Candidate | Rejected because |
|---|---|---|
| `src/components/hero/hero.ts:96-142` | Mark the HUD `aria-live` so screen readers hear value changes | It would announce every clock tick and seam-driven roll; static values with real `<dt>` labels is the correct treatment. |
| `Hero.astro:247, 251-257` | Raise red/gray seam contrast for colorblind users | The two halves are decorative background; the distinction is carried by the tear line, the two text labels riding it, and the value changes — not hue alone. |
| `src/components/hero/hero.ts:58-73` | Cache `measure()` boxes instead of reading rects every frame | Reads are batched before writes (one layout per frame) and the title is scroll-transformed; the cost is deliberate, documented, and this phase was perf-tuned. |
| `src/styles/global.css:20-24` | Restore a native scrollbar | Intentional and commented: Lenis drives the page and a scrollbar reappearing after the scroll lock would shift the layout mid-intro. Wheel/keyboard scrolling unaffected. |
| `src/layouts/Base.astro:67` | Skip-link placement/contrast | Verified working: first Tab reveals it top-left with a 2px red ring and correct focusable target. |

---

## Verification

Checks run against the production build (`npm run build` → `astro preview`), plus the dev server.

**Passed**

- `npm run build` — 2 pages, 1 optimized image (logo → 5kB webp), 0 errors.
- `npm run check` — 28 files, 0 errors, 0 warnings, 0 hints. (Note: this machine's global npm config has `omit=dev`, which silently skips `@astrojs/check`/`typescript`; `npm install --include=dev` was required.)
- Preloader sequence (production): dot-matrix logo assembles from scatter, progress bar fills half-red/half-cream on the logo's own grid, logo spins and zoomes through its tear, hero seam develops from center. Captured at three timestamps.
- Hero render: mk and en at 1440×900, 390×844, 320×700 — complete, correctly laid out, nothing clipped. Cyrillic correct in all four typefaces; `lang`, title, currency (ден./MKD) correct per locale.
- Keyboard: Tab reveals skip link (red ring), rings visible on both CTAs, Enter on the focused CTA opens the modal, Escape closes it, focus returns to the trigger. Native `<dialog>` semantics.
- Download modal: platform detection prepends Windows with "Препорачано за твојот уред" badge; backdrop click and Escape close; lockScroll pairs with dialog open/close.
- Reduced motion (`prefers-reduced-motion: reduce`): preloader removed from the DOM, hero renders fully static and complete, clock frozen at 08:00, HUD at seeded values (60/65/3600), grain/drip/pulse animations off.
- Scroll narrative: seam sweeps left with progress (verified mid-scroll), HUD and bottom row fade on schedule.
- axe-core 4.12.1: **0 violations**, 30 passes, 1 incomplete.
- Console (production): clean, no warnings or errors.

**Not verified**

- Color contrast *over the live halftone background* — axe returned "incomplete" for 25 nodes (layered/animated backgrounds defeat its sampler). Against solid ink the palette computes to 5.7:1+ for every text color; per-pixel sampling over the animated field was not done.
- 60fps frame pacing on integrated GPUs — claimed by the phase commits and the code structure supports it (compositor-only animations, static title layer, batched reads/writes, DPR and fps caps), but no profiling run happened in this pass.
- Real-device touch behavior — coarse-pointer paths (30fps cap, 13px cells, Canvas2D preloader fallback) were not exercised on hardware.

**Environment note (not a repo defect):** the dev server's `/_image` endpoint returns 500 for the preloader logo on this machine (production unaffected — the build emits a static asset). This is what surfaced finding #4.

---

## Verdict

**Needs changes.** One HIGH is standing (landscape CTA clipping). Nothing here questions the direction — the concept, craft, and accessibility floor are the strongest parts of the phase.

**Next modes, in order of impact:**

1. `/design responsive` — the landscape/short-viewport recomposition (finding 1).
2. `/design interaction` — resolve the dead `#tutorial` control (finding 2), the preloader fallback guards (finding 4), and the no-JS CTA target (finding 7).
3. `/design surface` — the `og:image` (finding 3).
4. `/design typeset` — the label size floor (finding 5).

Findings 6 and 8 are cleanup calls for the next pass.

---

## Resolution status

Verified on the production build (`npm run check` 0 errors, `npm run build` clean) at 740×360, 844×390, 667×375, 1440×900, 390×844, 320×700, both locales; console clean.

| # | Status | Resolution |
|---|---|---|
| 1 | Fixed | `@media (max-height: 520px)` recomposes the pin: facts and scroll cue hidden, lead + CTA share one row, title capped at 26svh. Primary CTA bottom now 344 of 360 at 740×360 (was 441). Mobile CTA tightened so it no longer overflows at 320px. |
| 2 | Fixed | Ghost "Како се игра" CTA, its `secondary` strings, `.btn--ghost` styles and the scroll-link handler removed. Re-add with the tutorial section. |
| 3 | Fixed | `og:image` / `twitter:image` + dimensions + alt in `Base.astro`, `public/og-image.png` (1200×630). |
| 4 | Fixed | Decode failure is logged; rotation/zoom tweens are added only when the logo exists. Verified with the logo request aborted: one `console.warn`, no GSAP warnings, preloader exits. |
| 5 | Fixed | HUD removed. Remaining labels inherit the 11px `.label` size (the hero's 10px overrides deleted); modal badge raised to 11px. |
| 6 | Fixed | `data-cursor`, `--z-cursor`, `cursor` strings removed. |
| 7 | Fixed | Primary CTA `href` is `latestRelease` (GitHub `/releases/latest`); JS still intercepts to open the modal (verified). |
| 8 | Fixed | Full-mode preloader minimum 2s → 1.3s. |

**Scope change absorbed:** the eyebrow, italic mark and HUD were removed from the hero before this pass (working-tree edit). The HUD script, its CSS, `eyebrow`/`mark`/`currency`/`stats` strings, the `--font-serif` token and the `@fontsource/cormorant-garamond` dependency went with them. This also retires the HUD half of finding 5 and the "game-HUD values" in the TL;DR.
