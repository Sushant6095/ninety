# Ralph verdict — /competition (route pass 4, pass 16)

- **Date:** 2026-07-19 · Anchor: real Sofascore capture + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-competition-vs-sofa.png`

## Finding: a real, honest 12-group standings surface — one em-dash (fixed).
"Group stage" + subtitle, then a 3-column grid of TWELVE real `<table>` standings (A–L), each # / TEAM (crest +
name + code) / MP / W / D / L / GF / GA / GD / PTS, "TOP 2 + BEST 3RDS" per group. Baked worldcup26 static data
(ADR-051). Not a card grid — genuine data tables (S3 clean).

## THREE WAYS OURS WAS WORSE (from the composite)
1. **Em-dash in the subtitle (9.G)** — "All 12 groups — the top two of each…". Fixed → colon ("All 12 groups: the
   top two…"). DOM re-check: page em-dash = 0.
2. **Name truncation** — "Czech Repu…" (P2). Mitigated: the 3-letter code (CZE) disambiguates every truncated
   name, so no ambiguity. Not a collision (S9 is overlap, not truncation). Kept.
3. **Static/completed baked standings** (every team MP 3) vs a live-updating reference table. Baked worldcup26
   (ADR-051), disclosed by the PROTOTYPE ribbon — owner data, NOT slop.

## READ-OUT-LOUD (group math) — AIRTIGHT (mechanical, via DOM).
Group A: Mexico 3W→9pts, GD +6 (6-0); South Africa 1-1-1→4, GD -1 (2-3); South Korea 1-0-2→3; Czech 0-1-2→1, GD -4
(2-6). Group C: Brazil 7 (+6) ranked above Morocco 7 (+3) — correct GD tiebreak. Group F: Netherlands 7 (+6) →
Tunisia 0 (-10). Every row: PTS = 3·W + D, GD = GF − GA, MP = W + D + L, sorted PTS desc then GD. All 12 groups
consistent with baked groups.json.

## MECHANICAL CHECKS
- Em-dash (visible): **0.** Banned play-money vocab: **0.** 12 `<table>` elements, 12 group headers A–L.
- Not a live-price surface (static standings) so a token bg is permitted; tokens-only holds. Negative GD uses the
  minus glyph (−), a number not copy — fine.

## SLOP TAXONOMY (after): S1–S10 all 0.
Real standings tables (not S3 cards), airtight math (S10), consistent rhythm, truncation disambiguated by code
(S9 clean), 9.G cleared.

## GATES
Clean prod build ✓ · dark ✓ · tokens only · reduced-motion (static tables).
