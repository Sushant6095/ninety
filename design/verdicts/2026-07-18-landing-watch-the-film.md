# design-cop verdict — landing "The film" (WatchReel / skiper67 `VideoReel`)

- **Date:** 2026-07-18 · Branch: `merge/live-integration`
- **Surface:** `apps/web/src/features/landing/WatchReel.tsx` on `apps/web/src/components/vendor/skiper/skiper67.tsx` (`VideoReel`)
- **Placement:** `LandingLong.tsx`, after `<FootballExperience />`, before the on-chain proof section.
- **Shots looked at:** `/tmp/reel-shots/reel-rest.png`, `reel-open2.png`, `reel-open3.png` (light theme).
- **Scope:** `pnpm dlx shadcn add @skiper-ui/skiper67` component pull + re-skin, landing-only, not a live-price surface.

> Persisted by the parent agent, from the design-cop subagent (read-only). Round 1 = PASS-WITH-NOTES (A11Y blocker); round 2 (after fixes) closes the A11Y line.

## Verdict: **PASS-WITH-NOTES → A11Y blockers closed = PASS**

Round 1 scored clean on 11/12 lines; the single non-clean line was **A11Y** (two real, narrow defects). Both are now fixed and verified in a keyboard-driven Playwright probe.

## Rubric (12 lines)
1 HIERARCHY PASS · 2 TOKENS PASS (no raw hex; `bg-bg/90` theme-aware backdrop; over-video pill/controls white via `mix-blend-exclusion` — correct over arbitrary frames) · 3 RESTRAINT PASS (N/A) · 4 BLEND PASS (copy reinforces the loop: game → price → proof) · 5 MOTION PASS (framer useSpring pill + clip-path spring, critically damped; transform/opacity/clip-path only; PRM → poster + plain fade; preview IO-gated) · 6 STATES PASS (default/hover/focus-visible/active; poster = loading) · 7 A11Y **PASS after fixes** (see below) · 8 COPY PASS (play-money-safe) · 9 CONSISTENCY PASS (shared `data-arrive`/`max-w`/card tokens) · 10 ELEVATION PASS (cursor-track pill + clip-path bloom + `<body>` portal fix + IO preload + re-skin; beats the vendor demo) · 11 FEELING PASS (the pill tracks your cursor, then the tile blooms to full screen) · 12 PROVENANCE PASS (row in PROVENANCE.md).

## Read-out-loud (clean, no contradiction)
eyebrow "THE FILM" · h2 "The whole idea, in one film." · sub "…the result proven on-chain. Press play — it opens full screen." · cursor pill "Play" · static tile pill "Watch the film" · open → fullscreen reel plays, page dimmed/blurred behind. "opens full screen" matches observed click→fullscreen. Clean.

## A11Y (line 7) — round-1 FAIL → round-2 FIXED
- **[FIXED] Modal semantics + focus management.** Portal root is now `role="dialog" aria-modal="true" aria-label="The film"`; focus moves to the close button on open; a `focusin` pull-back keeps focus inside the dialog (media-chrome shadow-DOM controls stay contained); focus returns to the trigger tile on close. Verified via keyboard: Enter opens → focus on "Close video"; Escape closes → focus back on "Play the film".
- **[FIXED] Close-button hit target.** `p-2`+`size-5` (~36px) → `flex size-11` = **44×44px** (measured).
- Autoplay audio: gesture-initiated (user clicks "Watch the film") — acceptable, not surprise-autoplay.
- **[FIXED, gap 7] Control legibility:** added a `from-black/50` bottom scrim behind the media-chrome control bar.

## Remaining minor notes (non-blocking)
- Motion timings are inline literals — could import from `design/motion.ts` to trace the 150–250ms law.
- `MediaTimeDisplay` timecode inherits media-chrome's font, not IBM Plex Mono — ephemeral over-video chrome, low-stakes.
- No explicit video-load-error fallback (owned static asset, low risk).
- Optional elevation: overlay a faint PriceChip tick / ghost River line on the preview so the tile itself shows "the price moving with it."

## ⚠ LEGAL FLAG (hard gate on PUBLIC ship — NOT on the mechanism)
`/video/ninety-reel.mp4` is the Video-495 anime named-player (Messi / Argentina) likeness with federation/sponsor (adidas/FIFA) marks — a **MECHANISM PLACEHOLDER**, same class as the scroll-scrub clip. Documented in `design/PROVENANCE.md` + the `WatchReel.tsx` / `skiper67.tsx` headers. **Swap for owned / licensed / anonymous film before any public deploy.** The player is asset-agnostic (`src` + `poster` props).

**Bottom line: PASS** — both A11Y blockers fixed and verified; remaining notes are minor; the one standing item is the pre-public-ship asset swap.
