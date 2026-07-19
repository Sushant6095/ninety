# design-cop verdict — FINAL RALPH LOOP (all 21 surfaces)

**Date:** 2026-07-18 · **Build:** local production (`pnpm --filter web build` + `next start` :3000, `NEXT_PUBLIC_API_URL=https://omnipitch.fly.dev`)
**Method:** clean prod build → screenshot lg+xl → LOOK at every image → read-out-loud → axe → route/link/canvas guards.

## VERDICT: SHIP (with two owner-blocked ceilings documented)

The owner opened the site and saw "40–50% broken". **Root cause found and fixed:** a desynced `.next` was serving
`/terminal` and `/board` an HTML that referenced a CSS chunk (`9e31b16…css`) absent from disk — the stylesheet
404'd, so every in-app surface collapsed to unstyled single-column with a full-bleed flag and a blank River. That is
one serving defect masquerading as forty. A clean build (`rm -rf .next` + a single build with no interleaved dev
server) restores every surface to full craft. **Verify on a CLEAN prod build; never reuse a `.next` a dev server touched.**

## What the render proves (LOOKED, not asserted)
- **/terminal** — Hyperliquid-grade 3-column desk. Momentum River draws the goal cliff at 74' (Ashour 31→55). Trade
  ticket, market-status rail, Booth timeline all present. Read-out-loud reconciles: position (EGY 60sh @41.0),
  movers (EGY ▲24.4), ticket (Buy Away EGY @55.4), River (55.4) — all agree.
- **/board** — Sofascore density: live match rows with mini-Rivers + H/D/A, movers, featured panel, power rankings.
- **/account** — every number reconciles (unrealized +307 = Σ position P&L; rank/credits consistent). Equity curve
  now lands on live equity (no false cliff).
- **/player, /team, /competition, /bracket** — REAL football-data.org / baked WC26; standings math + bracket
  feed-chain verified airtight; honest "shown, never invented" labels.
- **/proofs** — fail-closed: zero Solscan hrefs render; every unproven result is an honest "Proof pending" chip.

## Fixed this loop (all verified on the render)
P0: CSS-desync · nav double-active (`Trending`→`/moments`) · account equity false cliff · board GroupStandings
same-group/R16 contradiction (removed) · settings+onboarding wallet leaking retired `OMNIpitch` codename.
P1: fake Solana `SLOT` telemetry (removed) · moments "provable on-chain" over MINTLESS cards → "mints at settlement" ·
PowerRankings false "market-implied" → "Ninety model" · `transition-all`×2 · off-scale header type → scale steps ·
`font-aleo` (undefined) → `font-display` · leaderboard "you" row · replay + moment-detail dead-ends · onboarding
disabled-CTA helper · how-it-works "judges" fourth-wall copy.

## Gates
- 21/21 routes 200 (or correct 307 for /portfolio).
- axe: **0 criticals** every route. 190 `color-contrast [serious]` — systemic light-theme muted-label, P2, not a gate fail.
- 0 dead/placeholder Solscan links (guard verified on built /proofs).
- River canvases render (real width > 300; visually confirmed populated on terminal/board/match).
- read-out-loud reconciles on terminal / board / account / match.

## Owner-blocked ceilings (NOT in-loop defects — see docs/BLOCKERS.md)
- **B1** live TxLINE ingest OFF → markets/leaderboard/moments/portfolio empty on the deployed API.
- **B2** the demo market/trader/moment layer is modeled fixture data (real football entities, honestly framed under
  the PROTOTYPE banner), so REAL-DATA is capped at 7 on ~11 surfaces until the feed is live. This is the deliberate,
  ADR-076-settled demo posture; it was hardened for honesty this loop, not gutted.
- **B3** no demo auth token → the trade ticket's fill is modeled, not a live order.
