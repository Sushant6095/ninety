# Ralph verdict — landing `/` vs the Hyperliquid home STANDARD

- **Date:** 2026-07-18 · Branch: `merge/live-integration`
- **Reference:** `docs/hyperliquid-research/html/home.html` (a stripped saved page — CSS/JS did not load, renders as bare DOM; judged against the Hyperliquid home STANDARD the Ralph brief names: one-number-per-section, whitespace confidence, scroll rhythm, restraint, motion-as-information — NOT a pixel/palette match, per ADR-049).
- **Shots:** `ralph-ours-landing-dark.png` (dark, full), `theme-landing-light-full.png` (light, full — ADR-077).

> Persisted by the parent agent, verbatim-in-substance from the design-cop subagent (read-only).

## VERDICT: **BEAT-OR-MATCH ✅ — it beats.** No blockers, no palette breaches, both themes hold. 5 LOW hygiene items.

## Why it beats
1. **One-number-per-section, executed harder than the reference:** the giant `61.4` "price is probability" section is the single loudest thing on the page and teaches the whole thesis with one number; the tournament band is one-number-per-cell (`104 / 48 / 1,000 / Jul 19`, headline `sr-only` — the numbers ARE the headline); the pricing chapter is one word (`Free`). A stronger execution of Hyperliquid's own "block time · users · TPS · daily volume" rhythm.
2. **Whitespace/restraint parity:** `max-w-[1180px]` column, `py-16/24` rhythm, hairline chapter breaks, ONE filled CTA repeated verbatim, accent spent once (green on action; violet reserved for the single on-chain surface).
3. **Motion-as-information:** GSAP arrivals via `lib/gsap.ts`, the VelocityBand scroll-velocity chapter break, and LoopStage replaying a REAL goal halt (41→61.4) — meaning, not decoration.
4. **The decisive win — football texture Hyperliquid structurally can't have:** the 48-crest WC26 draw wall (a fan finds their country), the live HeroRiver, LoopStage mounting the real spine, the Booth's real lines, the 3D DribbleScene — each subordinated (crests `md:opacity-80`, heavy WebGL lazy + IO-gated + reduced-motion-static), so texture without a GPU tax on any live-price path.

## Rubric: all 12 PASS (line 2 with one nit)
Token-law CLEAN on palette — grep of `features/landing` for colour hex → zero; the light-theme hex lives only in `tokens.css[data-theme=light]` (sanctioned). The old "This isn't a terminal" contradiction is gone. Light theme holds identical structure/hierarchy/rhythm with AA-tuned accents — tuned, not inverted.

## Gap list (all LOW, none block)
1. **[FIXED] `CrestWall.tsx:51` off-scale `text-[10px]`** → changed to `text-label` (on-scale). The one line-2 nit; now spotless.
2. **[LOW · read-out-loud] Light shot caught the live tape at `63.0`, 1.6 above the anchor `61.4`.** Honest live drift (61.4 is framed as a definition, "A price of 61.4 means…", not the live mark; hero + LoopStage share one store), but the fix is the carried SSOT follow-up: derive `PriceScrub` from `FEATURED.mark.H*100` so anchor and tape can't visibly separate.
3. **[LOW] No pinned/scrubbed hero signature** (PricePath was cut for MotionScore); LoopStage + DribbleScene compensate — parity-neutral. An interaction-gated HeroRiver pin would exceed Hyperliquid on the hero specifically.
4. **[LOW] Ten disciplined sections vs Hyperliquid's spartan one-pager** — reads richer; keep the bentos as teasers, not feature-lists.
5. **[LOW · housekeeping] Dead `LandingPage.tsx`** still in the tree (unrouted) — user's call to delete (cascades).

**Ledger line:** `2026-07-18 landing / vs Hyperliquid-home STANDARD → BEAT-OR-MATCH ✅ (beats: one-number rhythm + football texture; both themes hold; 0 blockers, 0 palette breaches).`
