# Ralph verdict — /bracket (route pass 11, pass 23)

- **Date:** 2026-07-19 · Anchor: real Sofascore capture + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-bracket-vs-sofa.png`

## What it is
The real WC26 knockout tree (`BracketB`, hand-rolled). Two-tier "subtract-then-elevate" design: the **road to the
Final** (R16 → QF → SF → Final ← SF ← QF ← R16, converging) with **THE FINAL as the one elevated hero** (ringed card,
MetLife 82,500), + Third place under it, and the **Round of 32** as a quiet secondary grid below. GSAP round-reveal
rises inward and lands the Final last; reduced-motion leaves it all in place (content never JS-hidden).

## ADR-051 COMPLIANCE — CLEAN (this is the route's biggest trap, and it holds).
Every node is a **static placeholder label** derived from worldcup26's skeleton: "Winner Match 101", "Loser Match
102", "Runner-up Group A", "3rd Group A/B/C/D/F". **Zero fabricated teams, zero fabricated advancement** — who
advances MOVES during a match (TxLINE's), so it is never rendered here. The header says it out loud: "results come
from the live feed, never from the calendar." "live" appears only as "the live feed" (honest TxLINE reference) + the
footer/ribbon — never as a "live" claim over a future fixture. No S10 violation.

## THREE WAYS OURS WAS WORSE (from the composite / read-out-loud)
1. **Two em-dashes (9.G)** — the header prose "the group stage settles — results come from the live feed" and the
   scroll-region aria-label "Knockout bracket — scroll horizontally". Fixed: prose → "settles, and results come from
   the live feed"; aria → "Knockout bracket, scroll horizontally". DOM re-check after prod rebuild: visible **0**,
   aria **0**. The date-range en-dash "28 Jun – 3 Jul" (correct typography) was preserved untouched.
2. **Elbow connectors are faint** (hairline `border-y`, no SVG). The tree structure reads mostly from the labels
   ("Winner Match 89" inside M97 tells you M89 feeds it) rather than from strong connective lines. Judged acceptable,
   not a defect: the textual feeders + round columns + spatial grouping carry the tree; a heavier connector kit is a
   craft nicety, not slop. Left as-is (subtract-then-elevate favors the quiet version).
3. Sofascore anchor has no bracket surface; comparison is cross-kind. Ours holds on the craft axes the anchor governs
   (type scale, tabular-num dates/ids, hairline surfaces, one clear focal).

## READ-OUT-LOUD — RECONCILES + chronological.
Final "Winner Match 101 v Winner Match 102" ↔ Third place "Loser Match 101 / Loser Match 102" (same two semis feed
both — correct). Dates strictly ascending by round: R32 28 Jun–3 Jul → R16 4–7 Jul → QF 9–11 Jul → SF 14–15 Jul →
Third 18 Jul → Final 19 Jul. Real WC26 host cities/venues (Philadelphia, Dallas/Arlington, Boston/Foxborough, LA,
Miami, Kansas City, Atlanta, Vancouver, Mexico City, Monterrey; MetLife NY/NJ for the Final). Nav badges unchanged.

## MECHANICAL CHECKS
- Em-dash (visible): **0** (was 1). aria-label em-dash: **0** (was 1). Banned vocab (bet/stake/odds/wager/gamble):
  **0.** Match-node overlaps (S9, getBoundingClientRect over 32 nodes): **0.** No body horizontal-scroll bleed
  (bracket scrolls inside its own `overflow-x-auto` region, keyboard-focusable).

## SLOP TAXONOMY: S1–S10 all 0.
S1 crescendo: tree converges on the Final hero (real round progression). S2 rhythm: two tiers, hero vs quiet grid —
not uniform. S3: match nodes are legitimately equivalent (a bracket), the Final breaks uniformity as the focal — not
a decorative card grid. S4 one focal (the Final). S6 real display scale on the h1 + Final. S7 tree is horizontal, not
centered-everything. S8 motion clarifies (reveal rises inward to the Final) + reduced-motion safe. S9 clean. S10 all
labels static + sourced, no fabricated advancement, no "live" over a future fixture.

## GATES
Clean prod build ✓ · dark ✓ · tokens only · ADR-051 static labels (no fabricated results) · scroll region a11y intact
· date-range en-dash preserved. NOTE: `BracketPage.tsx` is unused dead code (grep: 0 importers) — not rendered, so
out of scope for this slop pass; flagged for a future dead-code sweep, not a /bracket defect.
