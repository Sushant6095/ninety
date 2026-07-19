# Ralph verdict — /onboarding (route pass 13, pass 25)

- **Date:** 2026-07-19 · Anchor: real Sofascore capture + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-onboarding-vs-sofa.png` (step1 · step2 · step3 · sofa)

## What it is
The first-run flow (`OnboardingPage`, single component, no dead sibling). 3 steps with a dot progress indicator:
**1 email → 2 invisible Solana wallet → 3 claim 1,000 credits → Trade tonight's match.** Walked the whole flow live
(typed email → Continue → Continue → Claim): every step advances, the claim confirms, and the final CTA routes to a
real match. Focused centered card (max-w-440), like /play — legitimate for a single-purpose flow.

## PLAY-MONEY ARMOR — SOLID (this is the "is this real money" surface).
Step 1 "Free to play. 1,000 credits on us. No card, no deposit, ever." · Step 3 "1,000 credits, play money. You trade
a live probability and settle at 100 credits if you're right." + "1,000 CREDITS" hero · persistent footer "Credits
are play money and have no cash value." · global ribbon "Play-money: no deposits, no payouts." **Banned vocab
(bet/stake/odds/wager/gamble) = 0.** Uses "trade a live probability" — never "odds". No real-money framing anywhere.

## THREE WAYS OURS WAS WORSE (from the composite / read-out-loud)
1. **3 body em-dashes (9.G)** — "1,000 credits on us — no card…" (→ period), "One tap to your wallet — no password."
   (→ period), "…invisibly — no seed phrase, no extension." (→ comma). Fixed with correct punctuation; DOM re-check
   after prod rebuild: visible **0**.
2. **1 shared aria-label em-dash** — the `Wordmark` logo link's accessible name "Ninety — home". It rides on every
   surface that renders the wordmark, so I fixed it at the source → "Ninety, home"; DOM aria em-dash on this route
   now **0** (and cleared app-wide). This is a genuine visible-to-AT 9.G hit the body-text walks had missed.
3. **Empty desktop gutters** — the ~440px card floats centered on 1440 (same as /play). Intentional for a focused
   first-run flow (a phone-first funnel); not slop, left as-is.

## READ-OUT-LOUD — RECONCILES.
Wallet is a truncated devnet DISPLAY form "9pXk3nQvRb…Hs7fZ2k" (not a live/dead Solscan link) — on-chain violet
(`--chain`) correctly scoped to the wallet icon + address only. Final CTA "Trade Canada vs Morocco" → href
`/match/wc26-can-mar` (real route) with meta "LIVE · 74′ · Round of 16" — reconciles with the featured CAN-MAR match
state (74′) used across the board. The 1,000 starting credits is consistent with the app economy (2,450 current
balance elsewhere = the post-trading balance; 1,000 is the initial claim). "Canada vs Morocco" uses full-name + "vs"
(a legitimate pairing form; the CAN–MAR en-dash chip form is used elsewhere — both are house-sanctioned).

## MECHANICAL CHECKS
- Em-dash (visible body): **0** (was 3). aria-label em-dash: **0** (was 1, shared Wordmark, fixed app-wide). Banned
  vocab: **0.** Flow advances 1→2→3, claim confirms, CTA routes to a live match. No dead Solscan href.

## SLOP TAXONOMY: S1–S10 all 0.
S1 crescendo: the 3 steps escalate (email → wallet → the 1,000-credit claim hero → trade). S2 rhythm inside the card.
S3 no icon-card grid — each step is a single focused panel. S4 one focal per step. S6 real display scale (h1 +
"1,000" hero). S7 centered is correct for a funnel (judged like /play). S8 motion (progress dots, button press
active:scale) is functional. S9 no collisions. S10 numbers sourced + reconcile, wallet is a display form not a
fabricated live link.

## GATES
Clean prod build ✓ (rebuilt twice: body em-dashes, then shared Wordmark aria) · dark ✓ · tokens only · on-chain
violet scoped to the wallet only · play-money armor intact · flow verified end-to-end. Routes done: +/onboarding.
Next: /settings, /profile/pitchwizard.
