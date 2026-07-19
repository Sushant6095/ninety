# Ralph verdict — /play (route pass 12, pass 24) — NO CHANGE (clean)

- **Date:** 2026-07-19 · Anchor: real Sofascore capture + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-play-vs-sofa.png` (desktop · mobile · sofa)

## What it is
"Next Goal" — the halftime mini-game (`PlayScreen` → `NextGoal`/`RoundFilter`, ADR-060). A phone-native, read-only
consumer of the live store: its scenario goal is produced by the page's own `matchSimHarness` (localStorage-only, no
backend, holds no writer). Vertical card: headline → match strip (AUS v EGY, one clock) → EGY WIN % live sparkline →
"Who scores next?" → two crest pick-cards → streak dots → past-rounds log.

## PLAY-MONEY ARMOR — SOLID (this is the route where the "is this real money" framing lives).
"FREE TO PLAY" chip · footer "Free · no sign-up · your streak saves to this device" · global ribbon "Play-money: no
deposits, no payouts." **No real-money framing anywhere. Banned vocab (bet/stake/odds/wager/gamble) = 0.** Uses "EGY
WIN %" (a probability read) — NOT "odds". The game awards POINTS + a STREAK, never credits/cash — correctly, since
it's a free skill game, not a market position.

## THREE WAYS OURS WAS WORSE (from the composite / read-out-loud) — none fixable without harm
1. **Empty desktop gutters.** At 1440 the ~600px game card floats with ~420px of empty bg each side; it does not use
   the desktop canvas the way a Sofascore-density page does. BUT this is an intentional phone-native game (ADR-060) —
   the mobile panel shows it filling a 402px viewport perfectly, which is its real home. Stretching a 3-second
   tap-game to 1440px width would HURT it. Judged: intentional tradeoff, NOT slop; left as-is (subtract-then-elevate).
2. **Score separator reads slightly loose** ("0 — 0" wide gap). DOM confirms it is the correct score **en-dash**
   "0–0" with `px-1` padding on the separator span (house score style, matches FeaturedPanel). Not an em-dash; kept.
3. **Cross-surface value drift** — EGY WIN % ticks 30.6–31.3 here vs Egypt 56 on /terminal / 32.9 on /account (B7
   fixture artifact). But /play is an INDEPENDENT localStorage sim (matchSimHarness, ADR-060), not a mirror of the
   board — self-consistent and honest about being a game. Owner data nuance, not slop.

## READ-OUT-LOUD — CONSISTENT, one clock.
Match strip shows a single clock ("LIVE 74'/79'", ticking as the sim advances) — the prior "two clocks" bug
(HALFTIME over LIVE 74') stays fixed: the header is the surface name "Next Goal", not a second match-state chip.
Score "0–0" (en-dash). Win % live-sparklines and ticks (30.6 → 31.3, green rising). Crests are baked local PNGs
(AUS, EGY — ADR-055). Empty state honest: "No rounds yet · call a goal above and your history lands here."

## MECHANICAL CHECKS
- Em-dash (visible body): **0.** aria-label em-dash: **0.** Banned vocab: **0.** Only em-dashes in the feature are a
  code comment + the `<title>` metadata "Next Goal — Ninety" (consistent with every route's "Ninety — X" tab-title
  pattern — the deferred site-wide metadata sweep, not per-route body copy). No dead Solscan href (no proofs here).

## SLOP TAXONOMY: S1–S10 all 0.
S1 crescendo (headline → match → the big "Who scores next?" → pick-cards). S2 real rhythm inside the card. S3 the two
pick-cards are the game's core choice, not a decorative icon-grid. S4 one focal (the question + picks). S6 real
display scale. S7 centered is correct for a focused single-purpose game (not a defaulted content page). S8 motion
(win-% sparkline, 3-second lock) is functional. S9 no collisions. S10 game sim is self-contained + labeled FREE, no
unsourced claim, no "live" over a fabricated state (mirrors the store's match).

## GATES
No source change (page already clean) → no rebuild needed. dark ✓ · tokens only · play-money armor intact ·
localStorage-only, no backend, no writer (ADR-060) · phone-native by design. Routes done: +/play. Next: /onboarding.
