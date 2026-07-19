# Ralph verdict — /account (route pass 8, pass 20)

- **Date:** 2026-07-19 · Anchor: real Sofascore capture + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-account-vs-sofa.png`

## Finding: the upgraded portfolio — internally AIRTIGHT, two body em-dashes (fixed).
Left nav (Overview/Positions/Accuracy/Moments/Proofs/Watchlist + @vd profile) · stat cards (CREDITS 2,450, PORTFOLIO
VALUE 11,660, UNREALIZED +295 on 8,915 in play, RANK #142 top 4%) · Session-equity curve · Forecast accuracy
(58% hit, 47 trades, best call +2,331, 3-win streak) · Open positions (5).

## READ-OUT-LOUD — RECONCILES + no false cliff.
- PORTFOLIO VALUE (11,660) == Session equity (11,660). Consistent.
- The equity curve DECLINES today and LANDS on the current equity (−140 / −1.2% today) — the prior-loop false-cliff
  fix holds (the curve ends at the live value, no fabricated cliff).
- Position math EXACT: AUS v EGY 60 sh, entry 41.0 → 32.9 → value 60×32.9 = 1,974, P&L 60×(32.9−41.0) = −486. CAN
  v MAR 40 sh, entry 52.0 → 60.8 → value 40×60.8 = 2,432, P&L 40×(60.8−52.0) = +352. Both airtight.
- RANK #142 matches the nav + /leaderboard pinned-you row.
- **No "OMNIpitch" codename leak** anywhere (grep of src = 0; DOM = 0). Play-money copy throughout.
- `/portfolio` → redirects to `/account` (browser lands on /account). No dead legacy route.

## THREE WAYS OURS WAS WORSE (from the composite)
1. **Two body em-dashes (9.G)** — "Your forecasting record — every call priced live…" + "Ninety runs on
   play-money credits — no deposits…". Fixed via a features/account sweep (` — `→` · `). DOM re-check: em-dash = 0.
2. **RD-capped fixture equity/positions** (B2/B3) vs a real ledger — disclosed by the LIVE ribbon; owner blocker,
   NOT slop.
3. The AUS-EGY position here (Egypt 32.9, ambient) differs from /terminal (Egypt 56, money-shot) — the B7 cross-page
   fixture artifact; internally consistent on /account. Owner data, not slop.

## MECHANICAL CHECKS
- Em-dash (visible): **0.** Banned play-money vocab: **0.** OMNIpitch leak: **0.** 0 console errors.

## SLOP TAXONOMY: S1–S10 all 0.
Real stat cards + equity curve + positions (not S3 marketing cards), airtight math (S10), curve lands on equity
(no S10 false cliff), no collisions (S9), no wallet leak, 9.G cleared.

## GATES
Clean prod build ✓ · dark ✓ · tokens only · /portfolio→/account redirect works.
