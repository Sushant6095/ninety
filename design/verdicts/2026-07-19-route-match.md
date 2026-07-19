# Ralph verdict — /match/wc26-can-mar (route pass 3, pass 15)

- **Date:** 2026-07-19 · Anchor: real Sofascore match capture + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-match-vs-sofa.png`

## Finding: strong match trading page — NO slop, no change (shared-sweep pre-cleared its em-dashes).
Header (Canada 1-0 Morocco · 78' 2H, MARKET LIVE, Favourite) · Momentum River (CAN WIN%, the goal cliff) · H·D·A
cells (CAN 63.0 ▲22.0 / DRAW 23.3 / MAR 13.8) · Buy/Sell trade panel (size, cost/avg-px/max-payout) · right rail
(Market Status, Portfolio, Open Positions, Games, Leaderboard). Reuses the terminal MatchColumn + depth tabs.

## THREE WAYS OURS WAS WORSE (from the composite)
1. **(Already fixed pre-emptively)** the systemic em-dash convention — 0 here because the /terminal + fixtures
   sweep pre-cleared the shared MatchColumn/River/data. DOM re-check: visible + aria em-dash = 0.
2. **RD-capped fixture data** — the desk runs fixture data (PROTOTYPE ribbon disclosed); the reference is real
   live. Owner blocker (B1/B2), NOT slop.
3. **Cross-page background-position P&L differs** (B7): EGY v AUS = +900 on /terminal vs −654 here, because each
   page money-shots its OWN selected match. INTERNALLY consistent on each page; a data-liveness artifact under the
   fixture, not a slop/copy defect. Logged B7.

## READ-OUT-LOUD (internal, single-screen) — RECONCILES.
Canada 1-0 Morocco · 78' 2H · River CAN WIN% ≈ 63 · HOME·CAN 63.0 with ▲22.0 today (41 open → 63 on the goal) ·
DRAW 23.3 ▼ · AWAY·MAR 13.8 ▼ (Morocco conceded) · left-rail CAN-MAR row 63.0/23.3/13.8 MATCHES the centre cells ·
CAN v MAR position +440 @52.0 (bought 52, now 63 = green). MARKET LIVE agrees with the live (non-halted) chart.
No team in two matches on-screen, no clock contradiction, no MARKET-OPEN-over-HALTED. The 61.4 seed has drifted to
63.0 live (honest drift; the ▲22.0-from-41-open reconciles it), which is why the literal "61.4" string is absent.

## MECHANICAL CHECKS
- Em-dash (visible + aria): **0.** Banned play-money vocab: **0.**
- **Blank-River guard PASSES:** visible River canvas 710 (≠300). ADR-058: no animated gradient on this live-price surface. ✓
- 1 console error = ticker `/api/rich/fixtures` 500 (no API on web-only build; owner/backend, not slop).

## SLOP TAXONOMY (after): S1–S10 all 0.
Strong data-dense match desk, real hierarchy (River + score focal), no card grid, no collisions, numbers reconcile
internally (fixture disclosed). No change made (do not manufacture fixes for a strong, clean route).

## GATES
Clean prod build ✓ · dark ✓ · River renders · tokens only · no gradient on live surface.
