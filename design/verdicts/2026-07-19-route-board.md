# Ralph verdict — /board (route pass 1 of the route phase, pass 13)

- **Date:** 2026-07-19 · Anchor: real Sofascore home capture + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-board-vs-sofa.png`

## Finding: a strong, dense Sofascore-class board — one systemic copy defect (em-dash).
Ticker strap · left rail (My Matches, WC26 stages with counts, Followed) · centre live match list (crest + score +
VOL + mini-River sparkline + H·D·A cells per row, date tabs, Live/Upcoming/Finished filter) · right rail (Featured
River panel with H/D/A + Trade, Top Traders, Starting Soon). Matches the reference's density; the mini-River +
H·D·A cells are a Ninety edge the reference lacks.

## THREE WAYS OURS WAS WORSE (from the composite)
1. **Em-dash label separators throughout (9.G)** — "FEATURED — LIVE", "WORLD CUP — ROUND OF 16", "WORLD CUP 2026 —
   STAGES", "Settlement — Solana", 2 Booth notification lines, and NotificationBell aria-labels. This is a
   SYSTEMIC app-wide convention (dozens of instances). Fixed the board-visible ones + the shared components/data.
2. **RD-capped fixture data** — the board runs fixture data (disclosed by the PROTOTYPE ribbon); the reference is
   real live data. Owner blocker (B1/B2), NOT a slop defect — not touched.
3. **Fewer per-row affordances than Sofascore** (no odds toggle / per-row favourite star) — but ours carries the
   River sparkline + H·D·A prices instead, which is a fair trade (more market signal, less list chrome).

## FIX (em-dash → house middot for separators, comma for prose)
`Featured · Live`, `WORLD CUP · ROUND OF 16` (fixtures group label, replace-all ×9 + terminal.ts), `World Cup 2026
· stages`, `Settlement · Solana`, Booth lines → comma, NotificationBell aria → dropped/comma, HomeShell sr-only h1
→ `Ninety · live World Cup 2026 exchange`. DOM re-check: **board body em-dash count = 0.** Match-pairing en-dashes
(CAN–MAR, England–Argentina, 2–1 scores) KEPT (house convention). These shared fixes also clear /terminal + /match.

## MECHANICAL CHECKS
- **Em-dash (body innerText): 0** (down from 7). **Banned play-money vocab: 0.**
- **Blank-River guard PASSES:** the two VISIBLE River canvases are 330×108 (≠300). The two 300×150 canvases are
  offscreen/hidden (visW=0), not blank Rivers on screen.
- **Read-out-loud reconciles:** CAN–MAR 77' 1-0 appears in My Matches, the live list, AND the Featured panel
  (1-0, GOAL·CAN) — consistent across all three surfaces; no team in two matches, no clock contradiction.
- ADR-058: no animated gradient / GPU-heavy bg on this live-price surface. ✓

## SLOP TAXONOMY (after): S1–S10 all 0.
Dense data cockpit (appropriate VISUAL_DENSITY), real hierarchy, no marketing card grid, no collisions, numbers
reconcile (fixture data disclosed by the ribbon = owner blocker, not slop), 9.G cleared.

## GATES
Clean prod build ✓ · dark ✓ · 1 console error (the ticker's `/api/rich/fixtures` 500 — no API on a web-only build; owner/backend, not slop).

## FOLLOW-UP
Route `<title>` metadata still uses em-dash ("Ninety — tonight's matches") — a metadata (browser-tab) instance, not
body copy; a separate metadata sweep across routes can clear those. Logged, not blocking.
