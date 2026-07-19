# Ralph verdict — landing THE LOOP section (LoopStage, pass 3)

- **Date:** 2026-07-19 · Pass 3 · Anchor: real Sofascore captures + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-loop-before-after.png` (BEFORE | AFTER | REF)

## Finding: this section was NOT a slop offender — it is one of the strongest.
It shows the product loop LIVE: headline "Goal. Halt. Reprice.", copy, a **live-state-synced legend**
(GOAL → HALT[active] → REPRICE → THE BOOTH → SETTLE tracks the real useHaltSequence), and the LoopStage panel
(River with the goal spike, H/D/A prices, GOAL·CAN badge, Trade action). No S3 grid, no generic copy, motion is
information (the synced legend + the playing sequence). Manufacturing a "fix" would be the opposite failure.

## THREE WAYS IT WAS WORSE (named from the composite, before the touch)
1. **Dead quadrant** — a wide 1fr left column carried ~300px of content beside a ~440px panel → large empty lower-left; the reference's featured column is packed.
2. **Layout-family repetition with beat 2** — both are "left copy / right river-price panel"; the differentiator (the sequence PLAYING vs a static market) is motion-only.
3. **Taller than its content earned** (`lg:py-24` + centered) vs the reference's density.

## FIX (subtract, not add)
Widened the panel column (`380–440px` → `420–480px`) so the live LoopStage commands the section and closes the
height-mismatch void; narrowed the copy column (`1fr` → `minmax(0,1fr)`); tightened `lg:py-24`→`lg:py-16`,
`gap-16`→`gap-14`. No content added (subtract-then-elevate); the panel now leads and the section is denser.

## SLOP TAXONOMY (after): S1–S10 all 0.
S2 density improved (py-16). S8 motivated (synced legend + playing sequence). S9 mechanical: no sibling collisions
(the navbar overlap in the shots is a fixed-nav scroll artifact). Repetition with beat 2 logged **P2** (motivated:
static live market vs the sequence playing; visuals now diverge — wider panel, prominent H/D/A cells).

## GATES
Clean prod build ✓ · dark ✓ · 0 console errors · tokens only · reduced-motion (LoopStage honours it; legend static under reduce).
