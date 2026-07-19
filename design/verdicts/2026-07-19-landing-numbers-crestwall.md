# Ralph verdict — landing NUMBERS / CREST WALL (section 7, pass 9)

- **Date:** 2026-07-19 · Pass 9 · Anchor: real Sofascore captures + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-numbers-before-after.png` (BEFORE centred | AFTER rail | REF)

## THREE WAYS OURS WAS WORSE (from the composite, before fixing)
1. **Dead quadrants (S2).** `items-center` centred the short 2×2 stat block in the vertical middle of a 440px
   column beside the tall 12-group crest wall → large void ABOVE and BELOW the numbers. The numbers read
   marooned, not airy.
2. **Weak left/right rhythm.** The stats (2 rows) and the wall (4 group-rows) had no vertical relationship — the
   eye couldn't pair a number to the crests. The reference (Sofascore) never leaves a column half-empty.
3. **Under-used width.** The stat column was 460px of which ~60% was empty.

## FIX (subtract the centring; elevate to a full-height stat rail)
Removed `items-center` (→ `lg:items-stretch`) and turned the stat block into a full-height vertical rail on lg
(`lg:flex lg:h-full lg:flex-col lg:justify-between`): the 4 numbers now distribute top→bottom and align
row-for-row with the crest-group rows (104↔A/B/C, 48↔D/E/F, 1,000↔G/H/I, Jul 19↔J/K/L). Mobile keeps the compact
2×2. No content added.

## SLOP TAXONOMY (after): S1–S10 all 0.
- **S2 FIXED** — the rail fills the height; no void. S1 numbers loud / crests subordinate texture (design-cop beat).
- **S9 mechanical (getBoundingClientRect): 48 crest imgs, 0 overlapping pairs, 0px.** No collisions.
- S3 not a card grid (plain numbers + grouped draw) · S4 one message ("the whole tournament") · S7 asymmetric ·
  S10 all four numbers sourced/accurate (104 WC26 matches · 48 teams · 1,000 credit grant · Jul 19 final).

## OWNER-PROXY
One thing not seen elsewhere: the tournament as a wall of 48 REAL crests laid out as the actual draw (12 groups),
each group row paired to a headline number. Football-native, not a logo cloud.

## GATES
Clean prod build ✓ · dark ✓ · 0 console errors · tokens only (floodlight = color-mix over --up) · reduced-motion (crest hover-lift gated `motion-reduce`).
