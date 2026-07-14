# TXLINE-MAP.md — every endpoint → feature → screen
Day-0 artifact. Lives in `docs/`. Feeds `SUBMISSION.md` ("specific TxLINE endpoints used") and `packages/txline` types.
Sources: documentation/quickstart · documentation/examples/onchain-validation · docs index (llms.txt). Items marked ⚠ get verified on Day 0 from the linked page.

---

## 0. Auth & network (confirmed)

Devnet: apiOrigin `https://txline-dev.txodds.com` · txoracle program `6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J` · TxL mint `4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG`.
Flow: `POST {apiOrigin}/auth/guest/start` → guest JWT → on-chain `txoracle.subscribe(SERVICE_LEVEL, weeks)` (World Cup free tier: level 1 or 12, no TxL needed) → sign `"{txSig}:{leagues}:{jwt}"` → `POST /api/token/activate` → apiToken.
Every data request carries BOTH headers: `Authorization: Bearer {jwt}` + `X-Api-Token: {apiToken}`.
⚠ Never mix networks: devnet tx must activate on txline-dev, mainnet on txline.

VERIFIED LIVE 2026-07-07 (ADR-015): the full flow runs end-to-end on devnet. Reality corrections vs the notes above — devnet free tier is **service level 1** (60s delay); **SL12 is mainnet** real-time (SL12 → `InvalidServiceLevelId` on devnet). The user's Token-2022 ATA for the TxL mint must exist before `subscribe` (create it idempotently first). `subscribe` args are `(service_level_id: u16, weeks: u8)`; accounts + PDAs (`token_treasury_v2`, `pricing_matrix`) per the IDL at `packages/txline/txoracle.json`. `/api/token/activate` body is `{ txSig, walletSignature (base64 ed25519), leagues: number[] }` and returns the apiToken as a **bare string**. Live subscribe tx e.g. `2RMQS9tYsfgnRz42pUih4meEXTB6LeDSgtjfprG51vcAdKxVZJd9G7tEsZz8WzyjC9rjmLHCjQNFw9rZgYDPqqtX`.

WIRE SHAPES (reality, ADR-015): all data endpoints return **top-level arrays of PascalCase records**. Fixtures = `/api/fixtures/snapshot`. Scores are `ScoreState` (nested `Score.{Participant1,Participant2}.{H1,HT,H2,Total}.{Goals,YellowCards,Corners}`, `Clock`, `Stats` map) — read GOALS from `Score.*.Total.Goals` via `goalsFromScore()`, NOT the numeric Stats map. Odds are per-bookmaker records (`PriceNames`/`Prices`/`Pct`). Stat-validation is a Merkle bundle (`statToProve`, `{sub,main,stat}TreeProof` of `{hash,isRightSibling}`). SSE streams interleave `{Ts}` keepalive frames with real events — the client `safeParse`s and skips non-matching frames. Schemas in `packages/txline/src/{scores,odds,fixtures}.ts`; real samples in `docs/txline-samples/`.

FRESHNESS (06-LIVE, 2026-07-07): **devnet SL1 stream transport latency ≈ 0.7–1.2s — sub-second, fresh** (measured across live scores+odds streams during in-play WC fixtures; odds ~90 real ticks/min, scores sparse/mostly `{Ts}` keepalives). This is feed-emit → client latency; the SL1 tier's documented **60s delay is data-vs-real-match** (by design), NOT transport. Topology verdict: transport is NOT materially delayed → **no STOP**; for true real-time trading use **mainnet SL12** — devnet SL1 is fine for dev / replay / the 07 proof-spike.

## 1. Endpoint inventory

| # | Endpoint | Kind | Status |
|---|---|---|---|
| A1 | `POST /auth/guest/start` | auth | confirmed |
| A2 | `txoracle.subscribe(level, weeks)` | on-chain ix | confirmed |
| A3 | `POST /api/token/activate` | auth | confirmed |
| S1 | `GET /api/scores/snapshot/{fixtureId}?asOf=` | snapshot | confirmed |
| S2 | `GET /api/scores/updates/{epochDay}/{hourOfDay}/{interval}` | historical (5-min buckets) | confirmed |
| S3 | `GET /api/scores/stream` (SSE) | stream | confirmed |
| S4 | `GET /api/scores/stat-validation?fixtureId&seq&statKeys=1,2` (comma-joined; statKey 1=home goals, 2=away goals — ADR-037) | proof bundle | confirmed |
| S5 | `txoracle.validateStatV2(...)` — sanctioned settle instruction (interface = STEP-0/ADR-037); settle on the `Action=="game_finalised"` record vs PDA `["daily_scores_roots", epochDay]`. Manual Merkle verify (Plan B) unsupported until TxLINE publishes the hash spec. | on-chain verify | V2 iface ⚠ |
| O1 | `GET /api/odds/snapshot/{fixtureId}?asOf=` | snapshot | confirmed (live) → wrapper `oddsSnapshot` |
| O2 | `GET /api/odds/updates/{epochDay}/{hourOfDay}/{interval}` | historical | confirmed (live) → wrapper `oddsUpdates` |
| O3 | `GET /api/odds/stream` (SSE, StablePrice) | stream | confirmed (live) → wrapper `oddsStream` |
| F1 | `GET /api/fixtures/snapshot` | snapshot | confirmed (live; earlier `scores/schedule` guess was WRONG — ADR-015) → wrapper `fixtures` |
| K1 | statKeys | reference | goals live in `Score.{Participant1,Participant2}.Total.Goals`, NOT in the numeric Stats map (the 1002/1003≈goals guess was wrong — ADR-015). Stats-map table ⚠ Day-0. `statkeys.ts` |

## 2. The map — endpoint → owner → features → screens

Law reminder: only `packages/txline` calls these. Screens consume via our REST/WS; "screens" below = ultimate beneficiaries.

| Endpoint | Owner (code) | Powers | Screens (of the 20) |
|---|---|---|---|
| A1–A3 | `packages/txline/client.ts` boot | everything | — |
| F1 fixtures | `worker-ingest` poll + `scripts/seed-fixtures.ts` | auto market creation (`initialize_market`), countdowns | 1 home · 4 pre-match · 16 bracket |
| O3 odds stream | `worker-ingest` → bus `odds.raw` → cortex de-vig → `prices.marks` | THE price engine; AMM re-anchoring; dynamic liquidity | 1 chips + mini rivers · 2 hero river + chips · 3 halted reprice · 6 trade-sheet live cost · 8 unrealized PnL · 10/11 leaderboards |
| O1 odds snapshot | ingest on market open / gap recovery | opening prices; circuit-breaker recovery | 4 pre-match prices; resilience everywhere |
| O2 odds updates | `replayer` + backtests | chart history backfill; Moment card rendering | 2 chart · 13/14 moments · 19 replay |
| S3 scores stream | ingest → bus `match.events` | goal→HALT ≤300ms (risk) · river glyphs · booth triggers · kickoff/HT/FT transitions · settlement trigger | 2 · 3 goal state · 5 settled banner · 14 moment context · 15 chat system msgs |
| S1 scores snapshot | ingest boot/reconnect | state recovery, never quote blind | resilience everywhere |
| S2 scores updates | `replayer` (walk 5-min buckets at Nx) | judge-proof demo · dev without live matches · backtests | 19 replay (the judges' screen) |
| S4 proof bundle | `worker-jobs/settlement.ts` at FT | fetch Merkle proofs for final score stats | 5 settled |
| S5 validateStat | `programs/omnipitch_core` settle path | **trustless settlement** — see §3 | 5 ProofBadge → Solscan · 18 how-it-works |
| K1 statKeys | `packages/txline` constants | mapping stats → H/D/A logic | — |

Screens with no direct TxLINE dependency (pure product): 7 position detail, 9 history, 12 profile, 17 onboarding, 20 states — they consume our own Postgres/Redis via REST.

## 3. Settlement pipeline — the spike is now DESIGNED, not unknown

Their program already verifies score stats on-chain: fetch `stat-validation` for home-goals and away-goals, then call `txoracle.validateStat` with a **two-stat predicate** against the anchored `daily_scores_roots` PDA. Their docs literally list "Automated Markets — settle prediction markets with on-chain verification" as the intended use.

Result derivation (final score H/A goals via statKeys):
- HOME win ⇔ validateStat(stat_home − stat_away, subtract, greaterThan 0) = true
- AWAY win ⇔ same with lessThan 0 · DRAW ⇔ both false (or equality predicate if available)

Our `settle_market(result, proof_bundle)` therefore: reconstruct the claimed predicate for `result` → **CPI into txoracle.validateStat** → require(true) → write result. Needs `ComputeBudgetProgram.setComputeUnitLimit(1_400_000)` (their example uses 1.4M CU).
⚠ Day-0 confirm: validateStat callable via CPI from our program (example uses `.view()` simulation). Fallback if CPI-blocked: replicate their Merkle verification in `proof.rs` against the same PDA roots (all data shapes — fixtureSummary, subTreeProof, mainTreeProof, statProof — are documented in the example).
Also required at FT: match `status` = finished from S3 before settling (don't settle at 90' of a match going to extra time — knockout stage!).

## 4. Day-0 checklist (in order, ~1 day)

1. Devnet wallet → subscribe service level 12 → activate token → commit `.env` names (never values).
2. `curl` every confirmed endpoint for a live/finished fixture; save raw payloads to `docs/txline-samples/*.json` (these become fixtures for tests + the replayer).
3. Open examples/fetching-snapshots + examples/streaming-data → fill the four ⚠ paths (O1, O2, O3, F1) into §1 and `packages/txline/src/*.ts` signatures.
4. Extract the full statKey table from scores/soccer-feed → `packages/txline/src/statkeys.ts`; confirm which keys are FINAL home/away goals incl. extra time.
5. Proof spike: run their single-stat validation example as-is on devnet → then attempt the CPI from a scratch Anchor program → decide CPI vs replicate; update `proof.rs` + ADR-004.
6. Note SSE mechanics (event names, heartbeat, reconnect/backfill semantics, seq field) → wire `worker-ingest` gap detection accordingly.
7. Log every friction point in `docs/SUBMISSION.md` → "TxLINE API feedback" (a scored deliverable — Day 0 literally earns submission points).

## 5. Open questions for their Discord (ask once, early)

1. Is `validateStat` CPI-callable from a third-party program, or view-only?
2. Rate limits per token on snapshots/streams?
3. Does "sign up through Solana" refer to Superteam Earn registration, or must the app itself use wallet auth? (Our ADR-006 hybrid satisfies both; confirming anyway.)
4. WC26 fixtureId list for knockout rounds — from schedule endpoint or a published mapping?

## 6. Player data — VERDICT (ITEM 10, 2026-07-14): TxLINE does NOT carry lineups / squads / names

We had never inspected TxLINE's payload depth for squads/lineups. Now we have — definitively, from the live
envelope captured 2026-07-07 (ADR-015) and re-scanned by `scripts/player-probe.mjs` (evidence artifact:
`docs/txline-samples/player-data-probe.json`). The probe deep-walks EVERY captured sample for any
lineup / squad / formation / player-name / shirt-number / position key.

**Finding — TxLINE carries NO stillness player data.** Across the whole envelope there are **zero**
lineup, squad, formation, player-name, shirt-number, or position fields. The one and only player-level datum
is `PlayerStats`, present on some score records:

```json
"PlayerStats": {
  "Participant1": { "806561": { "yellowCards": 1 }, "10095637": { "goals": 1, "yellowCards": 1 } },
  "Participant2": { "494854": { "goals": 1 }, "1204158": { "goals": 2 } }
}
```

That is a map of **opaque numeric player IDs → in-match stat deltas** (`{goals, yellowCards, …}`), and only for
players who registered an event — never the full XI. It has **no name, no shirt number, no position, no
formation, no bench**. It cannot render a Lineups tab.

**Two-source placement (ADR-051):** `PlayerStats` is data that MOVES during a match (goals/cards accumulate live)
→ TxLINE owns it, and it may feed goal/card glyphs by player if we ever resolve those IDs. But everything a
Lineups tab needs — names, numbers, formation, starting XI — SITS STILL, so by law it must come from a
stillness source that is NOT TxLINE. `worldcup26` has no player endpoint. → **API-Football** (free tier).

**Consequence for the build:**
- The Lineups tab (ITEM 6) already ships formation + positions + numbered dots from static data; it does not
  depend on TxLINE and does not need to.
- Real names/numbers come from `scripts/bake-lineups.mjs` — a one-shot offline bake of API-Football lineups to
  `apps/web/public/wc26/lineups.json`, gated behind `API_FOOTBALL_KEY`, **stillness-only** (an `assertNoMovement`
  guard fails the bake if any score/goal/minute field leaks in), **never a runtime dependency** (ADR-051).
- **BLOCKED — needs human credentials:** the free API-Football key must be created by a human. Steps +
  env var are in `docs/SETUP-LIVE.md`. Wiring the baked file into the (frozen) `apps/web` tab is a follow-up.

**Re-probe live:** `node scripts/txline-live.mjs` (needs a funded devnet wallet at `~/.config/solana/id.json`
for the on-chain subscribe) refreshes `docs/txline-samples/*.json`; then `node scripts/player-probe.mjs`
re-emits the verdict. The verdict is unlikely to change — TxLINE is a scores/odds oracle, not a squad feed.
