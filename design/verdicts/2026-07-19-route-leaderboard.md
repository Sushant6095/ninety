# Ralph verdict — /leaderboard (route pass 6, pass 18)

- **Date:** 2026-07-19 · Anchor: real Sofascore capture + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-leaderboard-vs-sofa.png`

## Finding: clean, consistent tournament leaderboard — NO slop, no change.
"Leaderboard / Net play-money P&L · World Cup 2026 · in credits (CR)" → a RANK / TRADER / P&L list, medals on top
3, avatars + monogram, right-aligned P&L. Already em-dash-clean.

## READ-OUT-LOUD — RECONCILES.
- Ranks 1–11 are in strictly DESCENDING P&L order (+18,240 > +16,810 > +15,290 > … > +1,290) — internally consistent.
- Cross-surface: @pitchwizard +18,240 (#1), @hexfan +16,810, @atlasfox +15,290, @kdb_flow +14,105, @deltahedge
  +13,880 MATCH the board's "Top Traders Today" panel exactly.
- The viewer's pinned **#142 @vd** "you" row is present (DOM `hasYouRow` true) so the viewer isn't invisible (the
  repo-history fix), and it matches the nav's "RANK #142 ▲3".
- Play-money copy ("Net play-money P&L", "credits (CR)"); no bet/stake/odds/wager.

## THREE WAYS OURS WAS WORSE (from the composite)
1. **RD-capped modeled trader stats** (B2) vs a real-user board — disclosed by the PROTOTYPE ribbon; owner blocker,
   NOT slop.
2. **Div-based rows** rather than a semantic `<table>` — a minor a11y nicety (rows are still readable/keyboard-ok);
   not a slop-taxonomy defect. Left as-is (do not manufacture a fix).
3. The Sofascore reference is not a leaderboard, so the comparison is cross-kind; ours is a clean, focused board —
   appropriate for the content.

## MECHANICAL CHECKS
- Em-dash (visible): **0** (pre-clean). Banned play-money vocab: **0**. Pinned-you row present.

## SLOP TAXONOMY: S1–S10 all 0.
Real leaderboard list (not S3 cards), medal hierarchy (S1), descending-P&L consistency + cross-surface match (S10),
no collisions (S9), play-money copy, 9.G clean. No change made.

## GATES
Clean prod build ✓ · dark ✓ · tokens only.
