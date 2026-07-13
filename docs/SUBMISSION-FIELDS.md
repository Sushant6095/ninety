# Submission fields — copy/paste ready

Voice law: play-money only (price · trade · credits). Never bet/stake/odds/wager. "Odds" only as a literal TxLINE endpoint name. Fill every `_TODO_` before pasting.

---

## Tweet (ready to paste)

> We built Ninety: a free-to-play, real-time prediction exchange for #WorldCup2026. Every match is a live 1X2 market priced off @TxODDS TxLINE, an AI Booth calls each swing, and results settle on-chain by proof — no admin decides.
>
> Then our proof-auditor found the sponsor's own settle path doesn't bind finality on-chain. So we fail-closed on purpose instead of shipping a forgeable settle.
>
> Play-money. 81 commits, 51 ADRs, 7 days. 🧵 _TODO_link

**Shorter alt (< 280 chars):**

> Ninety — a play-money prediction exchange for #WorldCup2026. Live 1X2 markets priced off @TxODDS TxLINE, AI commentary on every swing, results settled on-chain by proof (no admin). We found the sponsor's settle path can't prove finality — so we fail-closed on purpose. _TODO_link

---

## Submission form fields

**Project name**
```
Ninety
```

**One-line tagline**
```
A free-to-play, real-time prediction exchange for World Cup 2026 — live 1X2 markets priced off TxLINE, narrated by an AI Booth, settled on-chain by proof.
```

**Track**
```
Prediction Markets & Settlement
```

**Short description (≈50 words)**
```
Ninety turns every WC26 match into a live play-money market. A goal halts trading, the market re-anchors to a fresh TxLINE consensus mark, reopens on a decaying spread, and an AI Booth narrates the swing. Results are built to settle on-chain by verifying a TxODDS proof — no admin decides.
```

**Long description**
```
Ninety is a free-to-play, real-time prediction exchange for the 2026 World Cup. Every match opens a 1X2 market — Home / Draw / Away — priced 0–100 by an LMSR maker off a TxLINE consensus mark. You buy the side you think the crowd has wrong; a winning share is worth 100 credits and you can sell any time. Strictly play-money: no deposits, no cash payouts, ever — enforced in code.

The product is one tight live loop: a TxLINE score event triggers a goal, the market halts so nobody is filled on a stale price, it re-anchors to the fresh consensus mark (Shin de-vigged), reopens on a decaying 3× spread, and an AI Booth narrates the swing in plain language — filtered so nothing reads like gambling.

At full time the result is meant to settle on-chain by verifying a TxODDS cryptographic proof of the score, with no admin able to decide a result. Building it, we adversarially reviewed the settlement and found TxODDS's own sanctioned instruction (validate_stat_v2) does not bind finality on-chain — a permissionless caller could settle a wrong result with a genuine mid-match proof by selecting the batch. So settlement is fail-closed on purpose (SETTLEMENT_LIVE = false, an explicit revert), and we filed the finding back to the sponsor. We won't ship a settle we can prove is forgeable, even in play-money.

Built in 7 days: 81 commits, 51 ADRs, 257 automated tests passing, 5/5 Anchor tests, TxLINE verified live on devnet.
```

**TxLINE / TxODDS endpoints used**
```
Auth: POST /auth/guest/start · on-chain txoracle.subscribe (Token-2022) · POST /api/token/activate.
Fixtures: GET /api/fixtures/snapshot.
Scores: GET /api/scores/snapshot/{fixtureId} · /api/scores/updates/{day}/{hour}/{interval} · /api/scores/stream (SSE) · /api/scores/stat-validation?fixtureId&seq&statKeys=1,2 (Merkle proof).
Odds: GET /api/odds/snapshot/{fixtureId} · /api/odds/updates/... · /api/odds/stream (StablePrice SSE).
Settlement: CPI into txoracle.validate_stat_v2.
Verified live on devnet (ADR-015/016); one captured sample per endpoint in docs/txline-samples/. Full map: docs/TXLINE-MAP.md.
```

**Solana program (devnet)**
```
omnipitch_core — 6ps8ao7CVhacnRajvFXWTmkknsRnHfEbWmtQ3nDCdBkj
https://explorer.solana.com/address/6ps8ao7CVhacnRajvFXWTmkknsRnHfEbWmtQ3nDCdBkj?cluster=devnet
Live subscribe tx: 2RMQS9tYsfgnRz42pUih4meEXTB6LeDSgtjfprG51vcAdKxVZJd9G7tEsZz8WzyjC9rjmLHCjQNFw9rZgYDPqqtX
```

**Tech stack**
```
TypeScript monorepo (Next.js 15 web, Node api with uWebSockets.js, Redis Streams bus, Postgres/Prisma), Python worker-cortex (Shin de-vig pricing), Rust/Anchor 0.30 program on Solana devnet. AI Booth via LLM. TxLINE for scores/odds/proofs.
```

**Feedback for the sponsor (TxLINE/TxODDS)**
```
Docs (quickstart + worldcup examples) were accurate and enough to integrate end-to-end. Friction: (1) subscribe needs the user's Token-2022 ATA to pre-exist (AccountNotInitialized otherwise); (2) devnet only accepts SL1 while docs list SL1/SL12 as free — the SL12-is-mainnet distinction is easy to miss (InvalidServiceLevelId); (3) /api/token/activate returns a bare-string token, not JSON.
Open question that gates our on-chain settlement: validate_stat_v2 does not bind finality — should we settle over per-5-min scores roots (with an added finality gate) or via the resolution-root path (publish_resolution_root) that txoracle's own settle_trade/claim_via_resolution already use? See ADR-036/037.
```

**Links**
```
Repo: _TODO_ (public GitHub URL)
Demo video: _TODO_ (record SF Jul 14–15; shot-list at docs/demo/SHOT-LIST.md)
Deployed app: _TODO_ (Vercel prototype, ADR-048)
Program on Explorer: https://explorer.solana.com/address/6ps8ao7CVhacnRajvFXWTmkknsRnHfEbWmtQ3nDCdBkj?cluster=devnet
```

**Team**
```
_TODO_ — member names, roles, and X/GitHub handles
```

---

## Deadlines (verify against the official portal)
- India Buildathon: 2026-07-13 (per ADR-047)
- Global track: 2026-07-19 (per ADR-047)

## Human must fill before submitting
- Repo URL, demo video URL, deployed app URL, team names/handles, the tweet `_TODO_link`.
- Confirm the exact submission-form field labels on the official portal (these are the standard fields; the portal may name them differently).
