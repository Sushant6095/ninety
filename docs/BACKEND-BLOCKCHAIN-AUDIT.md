# Backend + Blockchain Audit — 2026-07-17

Verified by RUNNING (booted stack, ran `anchor build`/`anchor test`, probed devnet, screenshotted `/docs`). Every
claim below is backed by real output. Additive-only: no change to the engine single-writer / journal-then-ack /
on-chain-proof path / play-money copy. Two bug fixes were made (both outside those paths): `getPortfolio` DTO
wrapper (prior) and `OddsTick.MarketParameters` nullable (Part D).

---

## Part A — Swagger / OpenAPI UI  ✅ COMPLETE + VERIFIED

- `@fastify/swagger@8` + `@fastify/swagger-ui@3` registered in `server.ts` **before** the routes, UI served at
  **`GET http://localhost:4000/docs`**, spec at `/docs/json`, with a `bearerAuth` (JWT) security scheme.
- Every route carries a JSON `schema` (tags · params/querystring/body where read · response schemas). Attachment
  was made additive-safe: `additionalProperties: true` on responses (fast-json-stringify never strips bonus
  fields) and permissive request validation (ajv never rejects what the handler tolerates). Route logic unchanged
  (`admin.test.ts` + `webhooks.test.ts` still pass).
- **Verified against the running spec:** `28 paths · 30 operations · 30/30 with a response schema · 9 bearerAuth ·
  0 untagged.** Grouped into 11 tags: markets(3) orders(2) portfolio(1) leaderboard(1) moments(2) games(2)
  matches(2) search(1) rich(7) auth(6) system(3). **30 shown == 30 registered in `server.ts`** — no missing/extra.
- **Try it out (verified live):** reads → 200 (`GET /markets`, `/leaderboard`); auth-gated
  `POST /orders {matchId:18241006, outcome:H, side:buy, size:10}` with the demo JWT → **200 fill**
  `{accepted, fill:{size:10, price:0.344, cost:3.45}}`.
- **Screenshots:** `design/screens/impl/swagger-docs-full.png` (full tag-grouped list, 🔒 on the 9 auth routes,
  play-money header) + `swagger-docs-expanded.png` (POST /orders: request body + 200/202/400/401/404/409 schemas).

**Verdict: COMPLETE.** Every registered endpoint appears, grouped by tag, with request + response schema, and the
auth-gated endpoints are testable with the demo token.

---

## Part B — API ↔ FE-contract cross-check  ✅ ALL MATCH

For all 12 `lib/api.ts` callers (+ the 6 `/rich/*`), route response == client type == `API-CONTRACT.md`:

| endpoint | verdict |
|---|---|
| `getMarkets` /markets | MATCH (all 15 MarketView fields) |
| `getMarket` /markets/:id | MATCH (market/granted/amm) |
| `getQuote` /markets/:id/quote | MATCH (client untyped `unknown` — safe, forces narrowing) |
| `placeOrder` POST /orders | MATCH (200 fill + 202 both covered) |
| `getOrders` GET /orders | MATCH (untyped elements) |
| `getLeaderboard` /leaderboard | MATCH (untyped elements) |
| `getPortfolio` /portfolio | MATCH — the `{portfolio: PortfolioView}` wrapper fix is correct field-for-field |
| `getMoments` /moments, `getMoment` /moments/:id | MATCH |
| `getPicks`/`makePick` /games/picks | MATCH |
| `getMatchEvents`/`getMatchActions` /matches/:id/* | MATCH (untyped elements) |
| `search` /search | MATCH (teams typed, matches untyped) |
| `getStandings/Scorers/Team/H2H/Lineups/Player` /rich/* | MATCH (untyped `unknown` — safe) |

**WS frames:** gateway `Frame {ch,seq,t,d}` == client `Frame` exactly; channel names match `channels.ts`. `d`
payloads (`m:{id}:prices|events|actions|booth`, `lb:global`) are untyped passthrough and **have zero FE consumers**
(`wsConnect` has no runtime callers) — no typed drift possible. Functional note (not a drift): the client sends
`{op:"sub", ch, since}` for seq-resume but the gateway ignores `since` (backfill is an acknowledged follow-up).

**Verdict: NO DRIFT.** The only prior drift (portfolio) is fixed and verified. `as T` hides nothing else. Web
build green.

---

## Part C — Solana / blockchain logical audit  (proof-auditor)

Toolchain: anchor-cli 0.32.1 · solana 2.1.0. `anchor build` + both test paths actually run.

**1. On-chain TxLINE-proof verification — LOGICALLY SOUND (binding), INCOMPLETE (finality).**
`settle_market::handler` binds the proof correctly: fixture id (`fixture_summary.fixture_id == market.match_id`),
`epoch_day` derived on-chain, roots-PDA pinned (`require_keys_eq!` + `#[account(address = TXORACLE_ID)]`),
stat-identity bound (`STAT_KEY_HOME_GOALS`/`AWAY_GOALS`), predicate derived on-chain from `result`, and the CPI
return-data checked (`== [1u8]` from the pinned oracle). A caller **cannot settle an arbitrary outcome.** BUT two
latent gaps (documented in-code, the reason settlement is disabled):
- **G1 finality/extra-time (CRITICAL, latent):** `validate_stat` proves a stat is anchored in *some* batch, not
  that the record is `game_finalised`; `fixture_summary`/`ts` are caller-supplied. A mid-match snapshot could be
  chosen. `settle_market.rs:47-50`, `txoracle_cpi.rs:26-33`.
- **G2 shootout (CRITICAL, latent):** statKeys 1/2 are total goals → a penalty win reads level → predicate returns
  DRAW. `txoracle_cpi.rs:31-32`.
- **G3 (MED):** `VALIDATE_STAT_DISC` is the stale v1 disc; `validateStatV2` defined but unused; chain `settleData`
  builder + Helius parser use the old arg shape — must be swapped before the flag flips.

**2. SETTLEMENT_LIVE — LOGICALLY SOUND (fail-closed) — YES.**
`pub const SETTLEMENT_LIVE: bool = false;` (`txoracle_cpi.rs:34`); `require!(SETTLEMENT_LIVE, SettlementDisabled)`
is the first statement of the settle handler (`settle_market.rs:32`) → every settle reverts before any read/write.
**No admin/override result path exists** (grep-verified): the only writes to `Market.result/status=settled` are in
`settle_market`, behind the gate; `initialize_market` only sets `status=0` on `init`; re-settle blocked
(`require!(m.status < 3, AlreadySettled)`). Matches ADR-036/037.

**3. Toolchain (real output):** `anchor build` **SUCCESS** (warnings: anchor-lang 0.30.1 vs CLI 0.32.1 mismatch;
ambiguous glob re-export — benign). Tests: **Rust 2/2 pass**, **TS integration 5/5 pass on localnet**
(valid-claim-once, replay-fails, wrong-proof-fails, foreign-leaf-fails, authority-gated post-root). Default
`anchor test` targets devnet and **fails at deploy (insufficient funds: 2.176 SOL needed, 1.998 held)** — the
mocha suite only ran under `--provider.cluster localnet`. **`settle_market` has ZERO test coverage (HIGH gap)** —
all 7 tests exercise the claim/leaderboard path; the security-critical instruction is untested.

**4. Deployed? — NO.** `solana program show 6ps8ao7CVhacnRajvFXWTmkknsRnHfEbWmtQ3nDCdBkj --url devnet` →
AccountNotFound. Needs: funded wallet (~2.176 SOL rent-exempt for the 305 KB `.so` + buffer; wallet short ~0.18),
the built artifact (present), the program keypair (present, == declare_id).

**Per-item verdict:** LOGICALLY SOUND = yes for binding + fail-closed / partial for completeness (G1/G2 gated) ·
TESTED = claim path yes (7/7 localnet), settle path NO · DEPLOYED = NO (funding-blocked).

---

## Part D — TxLINE integration vs devnet fixture 18257865 (France v England)

Probe `scripts/txline-wrappers-probe.mjs` drives the real `TxLineClient` (zod parses live payloads → a mismatch is
a FAIL, not a silent pass). Fixture 18257865 is genuinely PRESENT on devnet (pre-match, kickoff 2026-07-18).

| wrapper | HTTP | result |
|---|---|---|
| auth (guest→subscribe→activate) | 200 | real — apiToken 45 chars |
| F1 fixtures/snapshot | 200 | real — 7 fixtures, 18257865 present |
| S1 scoresSnapshot | 200 | real — 2 records, GameState=scheduled |
| S2 scoresUpdates | 200 | empty — no scores this 5-min bucket (pre-match) |
| S3 scoresStream | 200 | empty — 0 events in tap window (pre-match/quiet) |
| S4 statValidation | 404 | correct empty — no processed record at seq=0 (scheduled) |
| O1 oddsSnapshot | 200 | **was FAIL (zod), now parses** — pre-match empty this window |
| O2 oddsUpdates | 200 | parses (CI mock: 3 real ticks) — empty live bucket |
| O3 oddsStream | 200 | parses (CI mock: 2 real ticks) |
| settlementProof | 200 | correct empty — `null` (not finalised, pre-match) |

**Bug found + fixed (verified):** `OddsTick.MarketParameters` was `z.string().optional()` but devnet O1 sends
`null` on element 0 → the whole odds array threw and **every odds tick was dropped for the fixture.** Changed to
`z.string().nullable().optional()` (`packages/txline/src/odds.ts` — not a forbidden path). Re-verified: txline
build clean, **txline tests pass** (8 wrappers parse real payloads including O2→3/O3→2 ticks that previously threw).

**Ingest → cortex → synthesized 1X2 mark — VERIFIED, never 33/33/33.** Seeded Market/Match for 18257865, pushed
OU+AH ticks via `push-demo-ticks.ts`, cortex synthesized. Both read paths agree:
`market:18257865` (redis) and `GET /markets` (API) → **`{H:0.5158, D:0.2784, A:0.2058}`** (sums 1.0), France
favoured — a real book, not uniform, not null.

---

## Part E — Manual TODO + honest verdict

### Everything gated on YOU (I cannot do these)
1. **Fly account** — marked high-risk; unlock at https://fly.io/high-risk-unlock (5 create attempts refused). Blocks the whole Fly deploy.
2. **Supabase** — the pooler `DATABASE_URL` (`...pooler.supabase.com:6543?pgbouncer=true&connection_limit=1`) + the direct `DIRECT_URL` (`:5432`). `.env` currently has localhost only.
3. **Redis Cloud** — a `REDIS_URL` (30 MB free). `.env` has localhost only.
4. **`anchor deploy`** — fund `HapvfRA4BoqUxz7N1MXsxwLDhSDhbqsE82PAs1Svnnwj` with ~1 SOL (short ~0.18; devnet CLI faucet is rate-limited — use https://faucet.solana.com). Then I can deploy + capture the id.
5. **Telegram bot token** — for EarlyWhistle (worker-jobs). @BotFather.
6. **Fixture pivot** — the local demo uses `18241006` (England v Argentina), which is **NOT on devnet** (verified ABSENT). The real devnet WC fixtures are `18257865` (France v England) + `18257739` (Spain v Argentina). A devnet-backed deploy should pivot the demo fixture + the token-persist to `18257865`.
7. **TxLINE token persist** — the argeng probe skips persistence when arg-eng is ABSENT; re-point it at `18257865` to persist `TXLINE_DEVNET_JWT`/`API_TOKEN`/`LIVE_FIXTURE_ID`.

### Remaining CODE work (not gated on you)
- **Backend APIs:** effectively complete — all endpoints registered, contract-matched (Part B all MATCH), Swagger'd (Part A), the play-money loop works end-to-end (fill → portfolio → orders). Known ceilings, each its own future ADR: balance-reservation TOCTOU, fill/mark parity, lifecycle-effect projection so PG `Market.status` isn't stale (engine-guardian MEDIUM), reject-after-timeout visibility.
- **Blockchain:** program is code-complete + logically sound **for the fail-closed forge state**. It is intentionally NOT complete for LIVE settlement: G1 (finality/`validateStatV2`) + G2 (shootout) + the compute-budget wiring must land before `SETTLEMENT_LIVE` can ever flip. `settle_market` needs test coverage (HIGH). `SETTLEMENT_LIVE` stays false.
- **Frontend:** the read-model surfaces (leaderboard/moments/search) are live; the board/terminal store-seam + the interactive-loop UI wiring remain (tracked in ADR-073/074) — that's frontend, not backend.

### The blunt verdict — NOT 100% done
- **CODE complete + tested:** backend APIs ≈ **95%** (all endpoints live, contract-clean, Swagger-documented, loop verified; the ~5% is the known ceilings + lifecycle projection). Blockchain **≈ 90% of the shippable (fail-closed) scope** — sound + build-green + claim-path tested, but `settle_market` untested and the live-settlement work is deliberately deferred. TxLINE wrappers ✅ (after the nullable fix); the OU/AH → 1X2 synthesis ✅ real.
- **DEPLOYED / live:** **0% deployed.** API not on Fly, program not on devnet, web on Vercel but pointed at localhost. Every deploy step is gated on the seven items above — all yours (Fly unlock, Supabase, Redis, ~0.2 SOL, bot token, fixture pivot). None are code blockers.

**Bottom line:** the code is in strong shape and the whole play-money loop + Swagger + TxLINE synthesis are
*verified working locally*; nothing is live yet, and going live is blocked entirely on your credentials/funding, not
on more engineering.
