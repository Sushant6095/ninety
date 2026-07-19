# Ralph verdict — landing OPENER (beat 1 cinema + beat 2 product) vs the real reference

- **Date:** 2026-07-19 · Branch: `merge/live-integration` · Pass 1 of the 3→9 loop
- **Anchor (this loop's correction):** the Hyperliquid `home.html` is bare-DOM (zero CSS — see BLOCKERS B5), so it
  is NOT a visual composite. Real anchors used: the Sofascore captures (`_reference-shots/*.png`, 1440×900),
  the mechanical slop taxonomy S1–S10, and the design-taste ban-list. Last loop composited against the blank
  HL page and self-scored "BEAT-OR-MATCH" — that is the void this pass closes.
- **Composite (attached):** `design/verdicts/composites/2026-07-19-opener-vs-sofa.png`
  (OURS beat 1 | OURS beat 2 | REF Sofascore home).
- **Shots:** `composites/ours-beat1-1440.png` (light), `composites/ours-beat1-dark.png`, `composites/ours-beat2-1440.png`.

## STRUCTURAL CHANGE done (STEP 1)
The scroll-scrub cinema is now BEAT 1 at the very top (carries the thesis "Every match is a market for ninety
minutes"); the notio hero is reworked as BEAT 2 (the product resolves in: live River + one action line "Trade
every minute of the match" + the single CTA, display type deliberately smaller than beat 1). The two-heroes-
fighting flatness the owner reacted to is gone: the page now reads loud (cinema) → resolve (product) → loop.

## BACKGROUND done (STEP 2)
`HeroGradientField` on beat 2: a token-derived animated mesh (two --up-over--bg blobs drifting on transform
only) + baked SVG grain + centre vignette. Compositor-only, reduced-motion → static, behind content (-z-10),
landing-hero-only. Deliberately NOT the WebGL shadergradient lib — STEP-2's own constraints (no repeated long
tasks, FCP not past ~200ms, off-main-thread) are met by CSS where three.js would threaten them.

## THREE WAYS OURS WAS WORSE THAN THE REFERENCE (named honestly, from the composite)
1. **Information-per-screen.** Sofascore's first screen = ~15 live matches + featured card + vote + Team-of-week
   ratings (instant value). Ours opens on a cartoon with zero data (beat 1). MITIGATION: beat 2 immediately
   after shows the live River + a moving price (60.7) — the crescendo is intentional, not a data vacuum, but
   beat 1 alone still reads as marketing, not exchange. Partially accepted (it is the emotional hook).
2. **Credibility.** The reference is wall-to-wall REAL football (crests, scores, player ratings); ours leads
   with an anime illustration — and a legally-risky one (B6). Design-agnostic to the mechanism; the asset is an
   owner-swap blocker.
3. **Beat-2 airiness.** The hero panel carried a soft dead zone vs the reference's confident density. Reduced
   by dropping the fixed `min-h-[44rem]` for content-driven `py-16/24`; acceptable split-hero now.

## SLOP TAXONOMY (opener, beats 1+2)
- S1 crescendo: **FIXED** by the restructure (loud cinema → quieter product → loop). 0.
- S2 padding rhythm: varied (`py-16/24`). 0. · S3 3-up card grid: not in the opener (the PROOF section has one — next passes). 0 here.
- S4 focal points: 1 per beat. 0. · S5 generic copy: specific ("1,000 credits a match"). 0. · S6 type scale: display ≫ body. 0.
- S7 centred: left-aligned asymmetric split. 0. · S8 decorative motion: scrub=goal, River=live data, field=depth (sanctioned). 0.
- **S9 collisions: FIXED** — the global PrototypeRibbon (0–32px) was overlapped 16px by the fixed `top-4` navbar;
  moved to `top-10` → mechanical getBoundingClientRect overlap now **0px**.
- S10 numbers/live: River "LIVE · 76' · 60.7" is the featured fixture market, disclosed by the PrototypeRibbon. 0.

## OWNER-PROXY TEST
1. Portfolio? Dark beat 1 (white thesis over the dark cinema) — yes, once the asset is licensed. 2. Screenshot to a friend? Yes (dark). 3. First screenful wants a scroll? Yes (SEQ readout + "scroll to replay"). 4. One thing never seen elsewhere? **Yes — beat 1→2: a goal you scrub, resolving into a live price (60.7) moving on that goal.** That is Ninety's unmissable thing and it is now the opening move.

## GATES
Clean prod build ✓ (rm -rf .next + one build) · both themes render (dark is the strong default) · 0 console errors ·
reduced-motion honoured (scrub → still frame, field → static) · tokens only (law-guard blocked one hex-in-comment, removed).

## OPEN (blockers, loop continues)
- **B6 — beat-1 asset is a named-player likeness (Messi/Argentina).** Owner must swap for an original/licensed/
  anonymous clip before public ship. Mechanism + composition are the deliverable; asset is not shippable.
- **B5 — no real Hyperliquid screenshot** to composite against (bare-DOM only).
