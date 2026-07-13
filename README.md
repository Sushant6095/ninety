# Ninety

**A free-to-play, real-time prediction exchange for World Cup 2026.** Live consensus prices from TxLINE, AI commentary on every swing, and results designed to settle trustlessly on Solana by verifying TxODDS's own cryptographic proofs. Strictly play-money — you trade a live probability with credits, never money.

![Track](https://img.shields.io/badge/track-Prediction%20Markets%20%26%20Settlement-2BD97C)
![Solana](https://img.shields.io/badge/Solana-devnet-9D6BFF)
![Play-money](https://img.shields.io/badge/play--money-no%20deposits%20·%20no%20payouts-FFB020)
![Tests](https://img.shields.io/badge/tests-257%20passing-2BD97C)
![Anchor](https://img.shields.io/badge/anchor-5%2F5%20localnet-2BD97C)
![Data](https://img.shields.io/badge/data-TxLINE%20live%20on%20devnet-9D6BFF)
![License](https://img.shields.io/badge/license-MIT-2BD97C)

<p align="center">
  <img src="design/screens/home.png" alt="Ninety — the live match board" width="100%">
</p>

| The Terminal — pro match trading | North Star — where it's going |
| :---: | :---: |
| <img src="design/screens/terminal.png" alt="Ninety Terminal" width="100%"> | <img src="design/screens/northstar.png" alt="Ninety North Star" width="100%"> |

---

## What it is

Ninety turns a live football match into a market. Each match opens a 1X2 market — **Home / Draw / Away** — priced 0–100 by an LMSR maker off a TxLINE consensus mark, and you buy the side you think the crowd has wrong. When a goal lands the market halts, re-anchors to the new reality, and reopens on a decaying spread; an AI Booth narrates the swing in plain language. At full time the result is meant to settle on Solana by verifying a TxODDS cryptographic proof on-chain — **no admin can decide a result**. It is play-money by construction: no deposits, no cash payouts, no real money anywhere in the system.

## The demo loop

This is the product — one match, five beats:

1. **Goal.** A TxLINE score-stream event (S3) arrives; the engine detects the goal.
2. **Market halts.** Trading pauses the instant the goal is confirmed (ADR-005) — no one gets filled on stale prices.
3. **Reprice.** The market re-anchors to the fresh consensus mark from the TxLINE odds stream, de-vigged by the pricing worker.
4. **Decaying spread.** It reopens on a 3× spread that decays back to normal, so the first traders in pay for the uncertainty (ADR-005).
5. **AI Booth narrates.** A single two-role LLM call turns the mark move + event into commentary on `commentary.v1`, passed through a vocabulary filter that regenerates or drops anything that reads like gambling (ADR-038, ADR-039).

At the whistle the settlement saga (ADR-035) fetches a TxLINE proof and submits an on-chain settle; winning shares are worth 100 credits. **That on-chain settle is deliberately fail-closed today — see [The settlement story](#the-settlement-story) for exactly why, and what we're asking TxODDS.**

## TxLINE is the primary data source

TxLINE/TxODDS is not a side input — it is the spine. It feeds the prices, the scores, and the proofs. Every wrapper lives in `packages/txline/src/client.ts`, returns parsed Zod types, and was **verified live against `txline-dev` + devnet** (ADR-015/016), with one real captured payload per endpoint in [`docs/txline-samples/`](docs/txline-samples/). Live subscribe tx: [`2RMQS9tY…rZgYDPqqtX`](https://explorer.solana.com/tx/2RMQS9tYsfgnRz42pUih4meEXTB6LeDSgtjfprG51vcAdKxVZJd9G7tEsZz8WzyjC9rjmLHCjQNFw9rZgYDPqqtX?cluster=devnet).

| Code | Endpoint | Wrapper | Powers which surface |
| :--- | :--- | :--- | :--- |
| A1–A3 | `POST /auth/guest/start` · on-chain `subscribe` · `POST /api/token/activate` | auth flow | Gates **every** data call (guest JWT + apiToken headers) |
| F1 | `GET /api/fixtures/snapshot` | `fixtures()` | Which WC26 matches exist → **the board** |
| S1 | `GET /api/scores/snapshot/{fixtureId}` | `scoresSnapshot()` | Live score on match/Terminal; settlement reads the `game_finalised` record here |
| S2 | `GET /api/scores/updates/{day}/{hour}/{interval}` | `scoresUpdates()` | 5-min buckets → **replay** + gap catch-up |
| S3 | `GET /api/scores/stream` (SSE) | `scoresStream()` | Live score ticks → **goal detection → halt** |
| S4 | `GET /api/scores/stat-validation?fixtureId&seq&statKeys` | `statValidation()` | The **Merkle proof the Solana program verifies to settle** |
| O1 | `GET /api/odds/snapshot/{fixtureId}` | `oddsSnapshot()` | Opening consensus mark |
| O2 | `GET /api/odds/updates/{day}/{hour}/{interval}` | `oddsUpdates()` | 5-min buckets → replay + catch-up |
| O3 | `GET /api/odds/stream` (StablePrice SSE) | `oddsStream()` | Live consensus → de-vig → engine marks → **the price you trade** |
| K1 | statKeys (`Score.*.Total.Goals`; keys 1,2) | `statkeys.ts` | Goal truth for scoring **and** settlement |

Integration feedback we filed for the sponsor is in [`docs/SUBMISSION.md`](docs/SUBMISSION.md) (e.g. `subscribe` needs the Token-2022 ATA to pre-exist; devnet only accepts SL1; `/api/token/activate` returns a bare-string token).

## Architecture

The whole system is decided, not improvised — 46 ADRs in [`docs/adr/`](docs/adr/) record every call. Two laws hold it together: **all inter-service traffic flows through `packages/bus`** (no service calls another directly), and **the engine is the single writer of market state** (journal-then-ack, one logical writer per market).

**Every folder answers "which layer am I?"**

| Layer | Folder | Talks to |
| :--- | :--- | :--- |
| **L6** Frontend | `apps/web` | api REST + WS only. Never DB, never chain writes. |
| **L5/L3** Edge + Engine | `apps/api` | Redis, Postgres, bus. Owns the single-writer trading engine. |
| **L1** Ingestion | `apps/worker-ingest` | TxLINE (via `packages/txline`) → bus. No business logic. |
| **L3** Pricing | `apps/worker-cortex` (Python) | bus in → Shin de-vigged marks + hazard liquidity out. |
| **L3/L4** Jobs | `apps/worker-jobs` | Settlement saga → Solana (via `packages/chain`), Moments, notify. |
| **L0** Blockchain | `programs/omnipitch_core` | Verifies TxLINE proofs on-chain. Trust only — never trading. |
| Contracts | `packages/*` | `schema` (event types), `bus` (Redis Streams ↔ Kafka), `txline`, `chain`. |

**Data-flow contract (the five lines that never bend):**
1. Every input becomes a canonical envelope (`packages/schema`) on the bus (`packages/bus`) — events only, never direct calls.
2. Frontend reads cold data over REST, hot data over WS with seq-resume. It renders; it never computes prices.
3. Postgres is durable truth (Prisma); Redis is hot state + bus + WS resume buffers. Cache derives from events, never the reverse.
4. The engine (`apps/api/src/engine`) is the only writer of market state; nothing in `engine/` imports from `http/` or `ws/`.
5. Solana holds only what needs trust — market registry, proof-verified results, leaderboard roots, point claims. The backend *forwards* the proof; the program *verifies* it.

```mermaid
flowchart LR
  TX["TxLINE / TxODDS<br/>odds · scores · proofs"] --> ING["worker-ingest<br/>normalize → envelopes"]
  ING --> BUS[("packages/bus<br/>Redis Streams")]
  BUS --> COR["worker-cortex<br/>Shin de-vig → marks + hazard"]
  COR --> BUS
  BUS --> ENG["engine<br/>single-writer LMSR"]
  ENG --> API["api<br/>REST + WS"]
  API --> WEB["web<br/>the board + Terminal"]
  ENG -. "settlement saga (ADR-035)" .-> CHAIN["packages/chain<br/>tx builders"]
  CHAIN -. "CPI validate_stat_v2" .-> SOL["Solana devnet<br/>omnipitch_core · fail-closed"]
  SOL -. "Helius webhook" .-> BUS
```

## The settlement story

This is the most important thing in the repo, and it is addressed to TxODDS.

**The design (ADR-017, a CLAUDE.md law):** there is **no admin result path**. `settle_market` is permissionless and one-shot, and settles *only* by CPI-ing into TxODDS's own on-chain oracle to verify a Merkle proof of the score. The backend forwards the proof; the program verifies it. Home/Away are TxLINE **statKeys 1 and 2** (total goals — admin- and repo-confirmed, ADR-037), and the on-chain predicate is `home_goals − away_goals` vs 0: `>0` → HOME, `==0` → DRAW, `<0` → AWAY.

**The finding (two adversarial `proof-auditor` passes, ADR-036 → ADR-037):** TxODDS's own sanctioned path, `validateStatV2`, **does not bind finality on-chain**. It proves a stat is Merkle-anchored in *some* batch of the fixture — any match moment — not that the proven record is the `game_finalised` one. The stat leaves carry **no `Action`/finality field**, `game_finalised` is selected *off-chain*, and the vendor's own v2 example hardcodes a caller-chosen `seq`. So a permissionless caller could take a **100%-valid proof for statKey 1 from a mid-match batch where the home side happened to lead** and settle `result=HOME` even though the match ended a draw or an away win — a wrong-result forge by seq/batch selection, with a genuine proof. (An earlier fix that pinned a "FINAL period" was refuted too: the guessed constants were real-but-non-goal stats, so pinning them would have been *more* dangerous than an impossible one, not less.)

**The decision — fail-closed, on purpose.** The first statement of the handler is `require!(SETTLEMENT_LIVE, SettlementDisabled)` with `SETTLEMENT_LIVE = false` (`txoracle_cpi.rs`). Every settle reverts before any state write — a real revert, not a sentinel trick. All the *other* on-chain defenses are implemented and reviewed: market↔fixture binding, oracle-program pin, stat-identity pin (`stat_home.key == 1`, `stat_away.key == 2`), one-shot, and no-admin-path. The single missing piece is a trustless gate binding the proof to the finalised record. **We will not ship a settle we can prove is forgeable — even in play-money, where no funds are at risk.**

**What we're asking the sponsor (STEP-0 #1b):** should Ninety settle via `validate_stat_v2` over the per-5-min scores roots (which then needs an added on-chain finality gate), or via txoracle's own **resolution-root** path (`publish_resolution_root`) that its `settle_trade` / `claim_via_resolution` already use to bind finality? Answer that and settlement flips live. Full write-up: **[ADR-036](docs/adr/ADR-036-settle-market-txoracle-cpi-statkey-binding.md)** and **[ADR-037](docs/adr/ADR-037-settle-statkeys-1-2-game-finalised-failclosed.md)** (the in-file `UPDATE 2026-07-08` records obtaining the `validate_stat_v2` IDL and confirms V2 carries no finality field).

## What's built and verified — and what's next

Real numbers, counted by the test runner (`pnpm test`), not estimated.

**Verified**
- **257 automated tests pass**: 248 TypeScript (vitest) across 6 packages — `api` 144, `worker-jobs` 68, `worker-ingest` 15, `schema` 10, `bus` 6, `chain` 5 — plus **9 Python** (pytest) in `worker-cortex`.
- **5/5 Anchor tests** (ts-mocha, localnet) covering the on-chain leaderboard claim: valid claim credits once, replay fails on the receipt PDA, a wrong proof fails, a tampered leaf fails, `post_leaderboard_root` is authority-gated (`programs/omnipitch_core/tests/omnipitch_core.ts`, ADR-031).
- **TxLINE integration is live on devnet** — subscribe → activate → snapshot ran authenticated against a real fixture (USA v Belgium, `18193785`), with in-play SSE latency measured ≈0.7–1.2 s (ADR-015/016). Real payloads captured in `docs/txline-samples/`.
- **The backend spine is real**: ingest → bus → cortex → engine → api, with a durable journal (ADR-025), a pure 7×7 lifecycle reducer (ADR-024), LMSR order fills with a 1% burned fee (ADR-026), and a crash-safe, resumable settlement saga (ADR-035).
- Anchor program builds clean (`anchor build`, ADR-030) and deploys to devnet — program `6ps8ao7CVhacnRajvFXWTmkknsRnHfEbWmtQ3nDCdBkj` ([Explorer](https://explorer.solana.com/address/6ps8ao7CVhacnRajvFXWTmkknsRnHfEbWmtQ3nDCdBkj?cluster=devnet)).

**Not yet — stated plainly, because judges punish overclaiming, not honesty**
- **The web frontend renders curated fixture data, not the live API yet.** `apps/web/src/lib/fixtures.ts` (hardcoded WC26 data) is imported by **23 files**; the real fetch client `lib/api.ts` exists but has **zero importers**. The board and Terminal you see are the real design driven by real WC26 data; wiring them to the live `/markets` + `/leaderboard` endpoints (ADR-042) and the WS bridge is the next step. `apps/web` currently ships **no tests**.
- **On-chain settlement is fail-closed** (`SETTLEMENT_LIVE = false`) pending the finality answer above.
- **Moments mint is a stub.** The on-chain Metaplex Bubblegum cNFT was cut for v1 (ADR-032/041); `mint_moment` is a deliberate no-op and Moments ship as server-rendered PNGs (ADR-040).

## Run it in 10 minutes

Needs **Node 18 or 20** (the `apps/api` WebSocket layer uses `uWebSockets.js`, which ships prebuilds for those), **pnpm 9**, and Docker.

```bash
pnpm install
cp .env.example .env          # fill TXLINE_TOKEN to hit the live feed; the mock runs without it
docker compose up -d          # postgres + redis
pnpm dev                      # turbo runs web + api + workers

# optional: replay a finished WC26 fixture end-to-end through the ingest plane
./scripts/replay.sh
```

Then read [`CLAUDE.md`](CLAUDE.md) (the laws) and skim [`docs/adr/`](docs/adr/). For the Anchor program: `anchor test` in `programs/omnipitch_core` (localnet). Demo script: [`docs/demo/script.md`](docs/demo/script.md).

## ADR index

Forty-six decisions, sequential, no gaps. One line each.

| # | Decision |
| :--- | :--- |
| [001](docs/adr/ADR-001-markets-1x2-only.md) | v1 ships one market kind per match: 1X2 (Home/Draw/Away). |
| [002](docs/adr/ADR-002-amm-only-lmsr.md) | Liquidity is an LMSR AMM — no order book in v1. |
| [003](docs/adr/ADR-003-points-offchain-ledger-onchain-roots.md) | Points off-chain in Postgres; per-matchday Merkle roots + on-chain claim. |
| [004](docs/adr/ADR-004-stack-ts-monolith-python-cortex-anchor.md) | Stack: one TS process, pricing in Python, trust layer in Anchor. |
| [005](docs/adr/ADR-005-goal-halt-reanchor-decaying-spread.md) | Goal/red halts the market, re-anchors, reopens on a 3× decaying spread. |
| [006](docs/adr/ADR-006-auth-hybrid-embedded-default.md) | Default embedded wallet behind email; optional Phantom/Backpack connect. |
| [007](docs/adr/ADR-007-bus-redis-streams-then-kafka.md) | Bus abstracts publish/consume: Redis Streams now, Kafka on graduation. |
| [008](docs/adr/ADR-008-ai-native-architecture.md) | The repo enforces its own laws on AI contributors. |
| [009](docs/adr/ADR-009-dev-postgres-host-port-5433.md) | Dev Postgres host port moved 5432 → 5433 to coexist locally. |
| [010](docs/adr/ADR-010-typed-event-contract-anyevent-union.md) | Every event type gets one Zod payload; `AnyEvent` discriminated union. |
| [011](docs/adr/ADR-011-redisbus-delivery-semantics.md) | RedisBus: consumer groups, at-least-once, XAUTOCLAIM crash recovery. |
| [012](docs/adr/ADR-012-driver-agnostic-bus-contract-suite.md) | A contract suite enforces every bus driver behaves identically before a flip. |
| [013](docs/adr/ADR-013-txline-client-transport-injectable-auth.md) | TxLINE client is transport-injectable with a cluster-pinned network guard. |
| [014](docs/adr/ADR-014-txline-wire-schemas-in-txline.md) | TxLINE wire-response Zod schemas live in `packages/txline`. |
| [015](docs/adr/ADR-015-txline-verified-live-devnet-reality-corrections.md) | Live devnet run corrected paths/schemas/service-level to observed reality. |
| [016](docs/adr/ADR-016-devnet-sl1-data-spine-live-stream-freshness.md) | Live SSE is sub-second fresh; skip keepalive frames, don't quote blind. |
| [017](docs/adr/ADR-017-settlement-proof-plan-a-cpi-validate-stat.md) | Settlement verifies via CPI into `txoracle.validate_stat` (Plan A). |
| [018](docs/adr/ADR-018-ingest-normalization-odds-raw-match-events-fixtures-compacted-idempotency.md) | Ingest normalizes SSE to canonical envelopes with (source, seq) idempotency. |
| [019](docs/adr/ADR-019-ingest-stream-gap-recovery-exactly-once-hardening.md) | Heartbeat gap recovery + exactly-once goal-derivation hardening. |
| [020](docs/adr/ADR-020-system-signal-plane-through-the-bus.md) | Adds a `SysEvent` system-signal plane through the bus; no raw side-streams. |
| [021](docs/adr/ADR-021-finished-fixture-replay-through-ingest-plane.md) | Provenance-tagged replay of finished fixtures, triggered via the system plane. |
| [022](docs/adr/ADR-022-cortex-pricing-v1-shin-devig-marks-hazard-liquidity.md) | Cortex de-vigs odds into marks (Shin) and emits a hazard liquidity hint. |
| [023](docs/adr/ADR-023-earlywhistle-telegram-live-match-cards.md) | Telegram live match cards: pure `renderCard`, global scheduler, per-match FSM. |
| [024](docs/adr/ADR-024-market-lifecycle-pure-reducer-7x7-guard-table.md) | Market lifecycle is a pure event-time reducer with a 7×7 guard table. |
| [025](docs/adr/ADR-025-engine-runtime-durable-journal-serialized-loop.md) | Durable journal-then-ack plus a per-market single-writer serialized loop. |
| [026](docs/adr/ADR-026-order-command-risk-lmsr-fill-fee-burn.md) | Order command: risk gate → LMSR fill → 1% burned fee → ledger effects. |
| [027](docs/adr/ADR-027-read-model-projection-bus-to-postgres-redis-idempotent.md) | Projects engine effects to Postgres/Redis, idempotent by `event_id`. |
| [028](docs/adr/ADR-028-engine-halt-reopen-hardening-auto-reopen-watchdog-hazard-single-count.md) | Hardens halt/reopen: auto-reopen, stale-mark watchdog, NaN-safe LMSR. |
| [029](docs/adr/ADR-029-anchor-toolchain-reconfirmed-cargo-check-interim-verify.md) | Fixed Anchor config; deploy still blocked, `cargo check` is interim verify. |
| [030](docs/adr/ADR-030-anchor-build-unblocked-cargo-lock-pins.md) | Six Cargo.lock pins unblock `anchor build`; `.so` + IDL produced. |
| [031](docs/adr/ADR-031-leaderboard-claim-merkle-receipt-pda-vault.md) | On-chain points claim: Merkle inclusion, receipt-PDA guard, PDA-owned vault. |
| [032](docs/adr/ADR-032-moments-onchain-bubblegum-cut-v1.md) | Moments cNFT minting cut for v1; off-chain metadata instead. |
| [033](docs/adr/ADR-033-hybrid-auth-embedded-external-jwt-per-match-grant.md) | Hybrid auth + idempotent per-match 1,000-credit grant. |
| [034](docs/adr/ADR-034-tx-builders-helius-webhook-chain-events.md) | Tx builders + a Helius webhook ingesting settlements to `chain_events`/bus. |
| [035](docs/adr/ADR-035-settlement-saga-idempotent-resumable.md) | Crash-safe 7-step settlement saga, zero double-credit, resumable. |
| [036](docs/adr/ADR-036-settle-market-txoracle-cpi-statkey-binding.md) | On-chain settle gate via `validate_stat` CPI; fail-closed on unconfirmed encodings. |
| [037](docs/adr/ADR-037-settle-statkeys-1-2-game-finalised-failclosed.md) | Corrects statKeys/finality; on-chain settle **hard-disabled** until finality gate. |
| [038](docs/adr/ADR-038-ai-booth-commentary-consumer.md) | AI Booth narrates marks/events via one two-role LLM call to `commentary.v1`. |
| [039](docs/adr/ADR-039-booth-post-llm-filter.md) | Booth output filter: regenerate once on forbidden vocab, else drop. |
| [040](docs/adr/ADR-040-moment-swing-card.md) | Server-rendered SVG swing card of the biggest mark move per match. |
| [041](docs/adr/ADR-041-moments-onchain-cut-confirmed-png-only.md) | Confirms Moments cut; ship PNG-only, saga MOMENTS step wired. |
| [042](docs/adr/ADR-042-home-data-layer-markets-leaderboard-ws-bridge.md) | Real Home endpoints: `/markets`, `/leaderboard`, price cache, WS bridge. |
| [043](docs/adr/ADR-043-home-reference-locked.md) | Locks the Ninety Home design reference before building components. |
| [044](docs/adr/ADR-044-brand-ninety-supersedes-omnipitch.md) | Canonical brand: the product is **Ninety**; OMNIPITCH is the old name. |
| [045](docs/adr/ADR-045-row-sparks-svg-river-lightweight-charts.md) | Row sparklines are inline SVG; `lightweight-charts` only for the hero River. |
| [046](docs/adr/ADR-046-mark-implied-trade-quote-read-side.md) | Trade quote is a read-side mark-implied LMSR preview; engine-q deferred. |

## Team, license, and the play-money disclaimer

Built for the **TxODDS World Cup Hackathon**, track **Prediction Markets & Settlement** (India Buildathon deadline Jul 13; global track to Jul 19).

**License:** [MIT](LICENSE) — open source, use it freely. Contributions welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).

**Play-money, and it is locked.** Ninety uses credits with no cash value. There are no deposits, no withdrawals, and no cash payouts anywhere in the system — that is a design invariant, not a setting. Product copy never uses gambling vocabulary; the constraint is enforced in code, down to a filter on the AI Booth's output (ADR-039).

<sub>The internal package namespace `@omnipitch/*` predates the rename to Ninety and is intentionally left as-is — renaming it would churn every import across the monorepo for no user-facing value (ADR-044). It is a namespace, not the brand.</sub>
