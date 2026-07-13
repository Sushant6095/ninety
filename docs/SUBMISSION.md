# Submission doc (grows daily — required by hackathon)

**Ninety** — a free-to-play, real-time prediction exchange for World Cup 2026. Track: **Prediction Markets & Settlement**. Built on a real TxLINE integration and Solana on-chain proofs. Strictly play-money: you trade a live probability with credits, never money — no deposits, no cash payouts, ever.

## Core idea

Every WC26 match becomes a live 1X2 market — **Home / Draw / Away**, priced 0–100 by an LMSR maker off a TxLINE consensus mark. You buy the side you think the crowd has wrong; a winning share is worth 100 credits and you can sell any time to lock a move.

The product is one tight live loop, five beats:
1. **Goal** — a TxLINE score-stream event (S3) arrives; the engine detects it.
2. **Halt** — trading pauses the instant the goal is confirmed, so no one is filled on a stale price (ADR-005).
3. **Reprice** — the market re-anchors to the fresh consensus mark from the TxLINE odds stream, Shin de-vigged by the pricing worker.
4. **Decaying spread** — it reopens on a 3× spread that decays to normal; the first traders in pay for the uncertainty (ADR-005).
5. **AI Booth narrates** — one two-role LLM call turns the mark move into plain-language commentary, filtered so nothing that reads like gambling ever ships (ADR-038, ADR-039).

At full time the result is meant to settle **on-chain by verifying a TxODDS cryptographic proof — with no admin able to decide a result** (ADR-017, a repo law). That path is deliberately fail-closed today; the reason is the lead of the README and the highlight of this submission (see the forge finding, below).

Built in **7 days** (2026-07-07 → 2026-07-13): **81 commits**, **51 ADRs**, **257 automated tests passing**, **5/5 Anchor tests**, TxLINE verified live on devnet.

## The forge finding (lead with this)

We built settlement to be trustless with no admin path, then adversarially reviewed it. Two `proof-auditor` passes found that TxODDS's own sanctioned settle instruction, **`validate_stat_v2`, does not bind finality on-chain**: the stat leaves carry no `Action`/finality field, and the `game_finalised` record is selected off-chain. A permissionless caller could therefore take a **100%-valid Merkle proof for statKey 1 (home goals) from a mid-match batch** where the home side led and settle `result = HOME` — a wrong-result forge built from a genuine proof, by choosing the batch/`seq` (ADR-037). An earlier layer (feeding the `home − away` predicate swapped or arbitrary anchored stats) was caught and pinned first (ADR-036).

Our decision: **settlement is fail-closed on purpose** (`SETTLEMENT_LIVE = false`, an explicit revert as the first line of the handler). Every other on-chain defense is implemented and reviewed. We refuse to ship a settle we can prove is forgeable — even in play-money where no funds are at risk — and filed it back to the sponsor as an open question (settle via `validate_stat_v2` over scores roots + an added finality gate, or via txoracle's own resolution-root path?). This is the strongest signal in the repo of how the settlement layer was actually built: reviewed, not assumed.

## TxLINE endpoints used
**Verified LIVE against txline-dev + devnet (ADR-015).** All wrappers in `packages/txline/src/client.ts` return parsed zod schema types (schemas: `src/{scores,odds,fixtures}.ts`); one real captured sample per endpoint in `docs/txline-samples/`. Subscribe tx built in `packages/chain` per law; live tx e.g. `2RMQS9tY…rZgYDPqqtX`.
- auth (A1–A3): `POST /auth/guest/start` → guest JWT · create Token-2022 ATA + on-chain `subscribe(service_level_id=1 on devnet, weeks)` · `POST /api/token/activate` `{txSig, walletSignature, leagues:[]}` → apiToken (bare string). Both headers on every data call.
- fixtures (F1): `GET /api/fixtures/snapshot` → `fixtures()` · `fixtures-snapshot.json`.
- scores snapshot (S1): `GET /api/scores/snapshot/{fixtureId}` → `scoresSnapshot()` · `scores-snapshot.json`.
- scores updates (S2): `GET /api/scores/updates/{epochDay}/{hourOfDay}/{interval}` → `scoresUpdates()` · `scores-updates.json`.
- scores stream (S3, SSE): `GET /api/scores/stream` → `scoresStream()` (event = one ScoreState).
- stat-validation (S4): `GET /api/scores/stat-validation?fixtureId&seq&statKey[&statKey2]` → `statValidation()` · `scores-stat-validation.json`.
- odds snapshot (O1): `GET /api/odds/snapshot/{fixtureId}` → `oddsSnapshot()` · `odds-snapshot.json` (empty until the fixture has odds).
- odds updates (O2): `GET /api/odds/updates/{epochDay}/{hourOfDay}/{interval}` → `oddsUpdates()` · `odds-updates.json`.
- odds stream (O3, StablePrice SSE): `GET /api/odds/stream` → `oddsStream()`.
- statKeys (K1): goals come from `Score.*.Total.Goals` (NOT the numeric Stats map). `src/statkeys.ts`; Stats-map table ⚠ Day-0.
- historical (replay): S2/O2 5-min buckets feed the replayer.

## TxLINE API feedback (what we liked / friction)
- Docs quickstart/worldcup examples were accurate and sufficient to integrate end-to-end. Friction: (1) `subscribe` requires the user's Token-2022 ATA to pre-exist (AccountNotInitialized otherwise) — a hint in the subscribe docs would help; (2) devnet only accepts SL1 while docs list SL1/SL12 as free — the SL12-is-mainnet distinction is easy to miss (`InvalidServiceLevelId`); (3) `/api/token/activate` returns a bare-string token (not JSON), unlike other endpoints.
## Business/technical highlights

**Product**
- One live match becomes a market, and the whole experience is the goal→halt→reprice→spread→narrate loop — a differentiated, TV-native moment no order book gives you.
- Play-money by construction: no deposits, no withdrawals, no cash payouts anywhere — a design invariant enforced in code, down to a filter on the AI Booth's copy. Product copy never uses gambling vocabulary.
- Football context (flags, team names, group tables, the 104-match bracket skeleton, stadiums) is baked at build time from the open-source **worldcup26** dataset — zero network at runtime — while TxLINE owns everything that moves (ADR-051).

**Technical**
- **TxLINE is the data spine, verified live on devnet** (ADR-015/016): subscribe → activate → snapshot ran authenticated against a real fixture (USA v Belgium, `18193785`); in-play SSE latency measured ≈0.7–1.2 s. One real captured payload per endpoint in `docs/txline-samples/`. Live on-chain subscribe tx: `2RMQS9tY…rZgYDPqqtX`.
- **Trustless settlement, no admin path** — `settle_market` is permissionless and one-shot, settling only by CPI into TxODDS's on-chain oracle; the forge finding above is why it is fail-closed today (ADR-017/036/037).
- **On-chain leaderboard claims — live and tested**: each matchday's leaderboard is a Merkle root on-chain; players `claim_points` by proving inclusion, guarded by a receipt-PDA against double-claims and paid from a PDA-owned SPL vault. All 5/5 Anchor tests cover this (ADR-003/031).
- **A real backend spine**: ingest → bus → cortex → engine → api, with a durable journal (ADR-025), a pure 7×7 lifecycle reducer (ADR-024), LMSR fills with a 1% burned fee (ADR-026), and a crash-safe resumable settlement saga (ADR-035). All inter-service traffic flows through `packages/bus`; the engine is the single writer of market state.
- **AI-native operations** (ADR-008): specialist agents (engine-guardian, proof-auditor, design-cop, quant-reviewer) and enforcement hooks trace every action — the forge finding was caught by this process, not by luck.
- **Counted, not estimated**: 257 tests pass (248 vitest across api/worker-jobs/worker-ingest/schema/bus/chain + 9 pytest in worker-cortex); 5/5 Anchor tests; Anchor program builds clean and deploys to devnet.

**Honest scope (judges punish overclaiming, not honesty)**
- The web frontend renders curated WC26 fixture data, not the live API yet (`lib/api.ts` exists, 0 importers; `lib/fixtures.ts` imported by 23 files). `apps/web` ships no tests yet.
- On-chain settlement is fail-closed (`SETTLEMENT_LIVE = false`) pending the finality answer from the sponsor.
- Moment cNFT minting was cut for v1 — `mint_moment` is a deliberate no-op; Moments ship as server-rendered PNGs (ADR-032/040/041).

## Links

- **Repo / front door:** `README.md` (this repository)
- **Program on Solana Explorer (devnet):** `omnipitch_core` — [`6ps8ao7CVhacnRajvFXWTmkknsRnHfEbWmtQ3nDCdBkj`](https://explorer.solana.com/address/6ps8ao7CVhacnRajvFXWTmkknsRnHfEbWmtQ3nDCdBkj?cluster=devnet)
- **Live TxLINE subscribe tx (devnet):** [`2RMQS9tY…rZgYDPqqtX`](https://explorer.solana.com/tx/2RMQS9tYsfgnRz42pUih4meEXTB6LeDSgtjfprG51vcAdKxVZJd9G7tEsZz8WzyjC9rjmLHCjQNFw9rZgYDPqqtX?cluster=devnet)
- **Settlement story (the forge finding):** [`docs/adr/ADR-036`](adr/ADR-036-settle-market-txoracle-cpi-statkey-binding.md) · [`docs/adr/ADR-037`](adr/ADR-037-settle-statkeys-1-2-game-finalised-failclosed.md)
- **TxLINE endpoint map:** [`docs/TXLINE-MAP.md`](TXLINE-MAP.md)
- **Demo video:** _TODO — record during SF Jul 14–15; shot-list at [`docs/demo/SHOT-LIST.md`](demo/SHOT-LIST.md)_
- **Deployed app:** _TODO — Vercel prototype URL (ADR-048); paste on deploy_
- **Ready-to-paste tweet + submission-form fields:** [`docs/SUBMISSION-FIELDS.md`](SUBMISSION-FIELDS.md)
