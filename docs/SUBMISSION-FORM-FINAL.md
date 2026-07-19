# Submission form — copy/paste, field by field

⚠️ Three fixes from your draft, explained at the bottom. Read those before pasting.

---

## Link to Your Submission
*(the single most useful link — use the demo video once it exists, otherwise the live app)*
```
<YOUR LOOM/YOUTUBE LINK>
```
Fallback if the video isn't up yet: `https://ninety-nu.vercel.app`

---

## Tweet Link
```
<YOUR TWEET LINK>
```

---

## Project Title
```
Ninety — the live World Cup prediction exchange
```

---

## Briefly explain your Project

```
Ninety turns every World Cup match into a live, play-money market. Every fixture opens a
Home / Draw / Away book priced 0–100, where the price IS the probability — 61 means the
market gives that side a 61% chance. A goal halts the market the way a real exchange
halts, it reprices to the new reality, an AI Booth explains the swing in plain language,
and the result is verified on-chain. Strictly play-money: 1,000 free credits every match,
no deposits, no cash payouts, ever — enforced in code, which is what lets it open to any
fan in any country.

TxLINE is the primary data source. We wrapped eight endpoints — fixtures, four score
endpoints including the live SSE stream and the Merkle stat-validation, and three odds
endpoints — with auth that is itself on-chain: guest token, Solana subscribe transaction,
then activation. The chain is the gate, not a logo.

The engineering centrepiece: the free feed carries only Over/Under and Asian handicap,
both two-outcome books, and never ships a 1X2 market. So we recover it — invert the
Poisson CDF on Over/Under for expected goals, invert the Skellam on the handicap for
supremacy, and run both through a Dixon-Coles bivariate-Poisson grid to produce a real
Home/Draw/Away board. The World Cup Final priced from the live feed: Spain 30.58,
Draw 48.92, Argentina 20.50. When the books are too thin to be honest, the market stays
unpriced — we never print a fabricated 33/33/33.

Building the on-chain settlement, we reviewed it adversarially and found that TxLINE's
proof does not bind match finality on-chain — a permissionless caller could settle a wrong
result using a genuine mid-match proof. So settlement is fail-closed on purpose
(SETTLEMENT_LIVE = false, a compile-time constant), and we filed the finding back to the
sponsor. We won't ship a settlement we can prove is forgeable, even in play-money.

Open source. 185 commits, 87 ADRs documenting every architectural decision, 279 passing
automated tests, 5/5 Anchor tests. Next.js 15 / React 19, a single-writer LMSR pricing
engine with journal-then-ack, a Redis-Streams bus, a Python quant worker, lightweight-charts
for the Momentum River, and an Anchor program on Solana that verifies TxLINE proofs. The
entire live stack runs on $0 of free tier.
```

---

## Link to your live & working MVP
```
https://ninety-nu.vercel.app
```

## Link to Your Live Demo Video
```
<YOUR LOOM/YOUTUBE LINK>
```

## Project's Public Repository Link
```
https://github.com/Sushant6095/ninety
```

## Link to your Project's Technical Documentation
```
https://sushi-2.gitbook.io/ninety-docs/
```
*(also live in-product at https://ninety-nu.vercel.app/docs — and the API's own Swagger at
https://omnipitch.fly.dev/docs, which judges can call directly)*

## Link to your Project's X Profile or a tweet
```
<YOUR TWEET LINK>
```

---

## TxLINE API experience

```
TL;DR: the docs got us to a live, authenticated devnet integration end-to-end without
hand-holding, and the cryptographic stat-proof layer is genuinely differentiating. Most
friction was small doc/shape mismatches — except one deep, important one around on-chain
settlement finality that we'd love the team's guidance on.

WHAT WE LIKED MOST

- The examples actually worked. Quickstart + World Cup examples were accurate and
  sufficient to wire the full flow ourselves: guest/start → on-chain subscribe →
  token/activate → snapshots → SSE streams → stat-validation, on txline-dev + devnet.
- Auth is a verifiable on-chain action. The Token-2022 subscribe model means access itself
  is provable on-chain — a clean fit for a product that settles on-chain. We captured a
  real subscribe tx on devnet.
- The stat-validation Merkle proofs are the standout. Live scores and per-bookmaker
  consensus prices are great, but the cryptographic proof layer is what let us design
  trustless on-chain settlement at all. Nobody else in this space ships that. It is the
  reason our architecture exists.
- Sub-second transport once connected. Devnet SL1 SSE latency measured ~0.7–1.2s median
  (distinct from the by-design 60s data delay) — plenty fast for a live tape.
- The free World Cup tier removed the commercial blocker entirely. We integrated fully
  without a purchase.

WHERE WE HIT FRICTION

1. Subscribe requires the user's Token-2022 ATA to already exist, otherwise
   AccountNotInitialized. Worth a line in the quickstart.
2. Devnet only accepts SL1 while the docs list SL1/SL12 as free — the "SL12 is mainnet"
   distinction is easy to miss and surfaces as InvalidServiceLevelId.
3. /api/token/activate returns a bare string token, not JSON. Small, but it breaks a
   naive .json() parse.
4. A devnet txSig activates exactly once. Any client that re-activates on a 401 dies
   permanently with "already used". Renewing the guest JWT (plain POST, no signature) and
   reusing the same apiToken is the correct path — this cost us real debugging time and is
   worth calling out explicitly in the docs.
5. OddsTick.MarketParameters is documented as non-nullable but devnet sends null, which
   silently dropped every odds tick until we made it nullable.
6. The free feed carries Over/Under and Asian handicap but no 1X2, so any match-result
   product must derive it. We inverted Poisson and Skellam into a Dixon-Coles grid to
   recover H/D/A. Not a complaint — but a 1X2 endpoint, even derived, would unlock a lot
   of consumer products.

THE OPEN QUESTION THAT GATES OUR ON-CHAIN SETTLEMENT

validate_stat_v2 does not bind finality on-chain. A permissionless caller can select a
mid-match batch and settle a wrong result with a genuine proof. Should we settle over
per-5-min scores roots with an added finality gate, or via the resolution-root path
(publish_resolution_root) that txoracle's own settle_trade / claim_via_resolution already
use? We fail-closed rather than ship it, and documented the finding in ADR-036/037. We'd
genuinely like the team's guidance here — it's the one thing standing between this and a
fully trustless settlement.
```

---

## Anything Else?

```
Everything linked above is live and working now — the deployed app, the public repo, the
API with callable Swagger docs, and the on-chain program on devnet.

Two things are deliberately incomplete, and we'd rather name them than have you find them:

1. Settlement is switched off on purpose. We proved the sponsor's proof path forgeable and
   fail-closed rather than ship it (details in the TxLINE feedback above).
2. Some surfaces run a recorded replay of real TxLINE payloads rather than an in-play feed,
   because the tournament's remaining fixtures were pre-match during the submission window.
   Where that is true, the interface says so. Nothing on screen is invented data.

We're continuing to build this well past the hackathon — the roadmap, and where the prize
money would go, is at https://ninety-nu.vercel.app/docs/roadmap
```

---
---

# ⚠️ THE THREE FIXES — read before pasting

### 1. Your numbers were wrong, and this is the exact defect your own audit flagged
You wrote **"257 tests, 50+ ADRs."** The repo has **279 tests and 87 ADRs**, and **185 commits**.
Understating is as bad as overstating — a judge who checks finds your stated numbers don't match, and
then doubts every other figure you cite. Re-run before you paste:
```
echo "$(git rev-list --count HEAD) commits, $(ls docs/adr/ADR-*.md | wc -l | tr -d ' ') ADRs"
```

### 2. "Only 50 percent is done" could lose you the submission — delete it
Your draft says *"all links are in progress, this is not final work only 50 percent is done."*
The rules state that submissions which are **mockups or non-working concepts are automatically
disqualified**, and that the demo video is an **absolute requirement to pass initial screening**.
Telling a screener the work is half-finished, in the field where you could instead be pointing at a live
deployed product, invites exactly the wrong conclusion. You have a working app, a live API, a public repo
and an on-chain program. Say that. The rewrite above still names what's incomplete — but as deliberate
engineering decisions, which is a completely different signal.

### 3. Your description led with infrastructure, not the product
The original opened on TxLINE and the data layer. A judge scoring **"would a mainstream, non-technical fan
use this?"** learns nothing from that. The rewrite opens with what it does for a fan, then earns the
technical depth. Same facts, correct order.

**Still needed from you:** the demo video link, the tweet link, and your team names.
