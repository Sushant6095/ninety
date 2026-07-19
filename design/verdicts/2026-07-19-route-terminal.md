# Ralph verdict — /terminal (route pass 2, pass 14)

- **Date:** 2026-07-19 · Anchor: real Sofascore match capture + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-terminal-vs-sofa.png`

## Finding: a strong, dense pro-trading terminal — systemic em-dash convention (cleared).
Left rail (live MARKETS list + Attack Momentum) · centre (match header AUS 0-1 EGY 79' 2H, the Momentum River with
the 74' goal cliff, Booth, Market-State tabs, H·D·A cells, Next Goal) · right rail (Market Status, Portfolio +
equity curve, Open Positions, Games, Leaderboard). The Momentum River + LMSR params + live P&L are a Ninety edge
the reference lacks.

## THREE WAYS OURS WAS WORSE (from the composite)
1. **Em-dash separators + prose throughout (9.G)** — ~13 visible + 7 aria (event log "GOAL — Ashour", halt "under
   review — repricing", "Crowd call — who wins?", "No incidents yet — kick-off build-up", "Momentum River — …",
   "Leaderboard — Tournament", "Next Goal — …" aria ×several, CreditPill "credits — open portfolio", etc.).
   SYSTEMIC. Fixed via a bounded sweep: `" — " → " · "` across `src/features/terminal/**`, `src/lib/terminal.ts`,
   `src/features/games/**`, `src/components/ui/CreditPill.tsx` (data + aria; comments in those files also normalise,
   harmless). DOM re-check: **terminal visible + aria em-dash = 0.**
2. **RD-capped fixture data** — the desk runs fixture data (PROTOTYPE ribbon disclosed); the reference is real live.
   Owner blocker (B1/B2/B3), NOT a slop defect — not touched.
3. **Very high density** vs the reference's calmer match page — but that is the product (a terminal), appropriate
   VISUAL_DENSITY; hierarchy holds (the River + score is the focal, panels are subordinate).

## READ-OUT-LOUD (the highest-yield check here) — RECONCILES.
One match, one clock, one score: Australia 0-1 Egypt · 79' 2ND HALF · goal ASHOUR ← HAFEZ 74'. The River shows
EGY WIN% cliff 31 → 56 on that goal; H·D·A cells AUS 28.0 / DRW 16.0 / EGY 56.0 match the left-rail AUS-EGY row AND
the Egypt-favored post-goal state; MARKET LIVE agrees with the live (post-halt) chart (no MARKET-OPEN-over-HALTED
contradiction); the EGY position is green (+900). No team in two matches, no clock contradiction.

## MECHANICAL CHECKS
- Em-dash (visible + aria): **0** (down from ~20). Banned play-money vocab: **0**.
- **Blank-River guard PASSES:** visible River canvas 710 (≠300). ADR-058: no animated gradient / GPU-heavy bg on
  this live-price surface. ✓
- 1 console error = the ticker's `/api/rich/fixtures` 500 (no API on a web-only build; owner/backend, not slop).

## SLOP TAXONOMY (after): S1–S10 all 0.
Data cockpit density is appropriate; real hierarchy; no marketing card grid; no collisions; numbers reconcile
(fixture data disclosed = owner blocker); 9.G cleared. Match-pairing en-dash (CAN–MAR) + score/range en-dash kept.

## GATES
Clean prod build ✓ · dark ✓ · River renders · tokens only · no gradient on live surface.
