# ADR 071 — Live H/D/A is synthesized from the O/U feed (never a fabricated even book), and the POST /orders intake path

Status: accepted · 2026-07-17 · reconciles ADR-001 (1X2 markets) with ADR-018 (live feed is O/U only) · supersedes the open question in ADR-042 note only for the intake wiring, not the q-anchoring.

## Context

Two prior ADRs were never reconciled:

- **ADR-001** (2026-07-05): markets are 1X2 (HOME / DRAW / AWAY). The entire product is built on this — the web
  board, terminal, moments, proofs, the Telegram cards, and the API contract (`Order.outcome ∈ {H,D,A}`,
  `quote.ts OUTCOMES=["H","D","A"]`, `emit.ts` index→1X2 label, `markets.ts` "outcome must be H, D or A").
- **ADR-018** (verified against `docs/txline-samples/`): the live TxLINE free tier (devnet SL1) emits **only
  2-outcome** books — `OVERUNDER_PARTICIPANT_GOALS` (`["over","under"]`) and `ASIANHANDICAP_PARTICIPANT_GOALS`
  (`["part1","part2"]`). **No `["1","X","2"]` / match-result market appears anywhere in the captured feed.**

The break, traced this session: `worker-cortex/src/cortex/pricing.py` emits a mark keyed by the feed's own
`priceNames` (`over`/`under`), so on live data `fair["H"]` is `undefined` and `services/quote.ts:17`
(`fair[o] ?? 1/OUTCOMES.length`) **silently degrades every live 1X2 book to a flat 33/33/33**. The claimed
"cortex derives 1X2 downstream" (normalizer.ts comment, ADR-018) was never implemented — `dixon_coles.py`
exists but is not wired into the tick path.

Separately, `POST /orders` — the core trade action — did not exist: `http/routes/orders.ts` was `export {};`,
and `main.ts` **discarded** the single in-proc `Engine` handle (`await startEngine(redis)` with no capture), so
there was no intake path into the single-writer engine at all.

## Decision

### 1. Keep the H/D/A product face; SYNTHESIZE it in cortex (Option 1)

The live outcome space stays HOME/DRAW/AWAY end to end. The frontend, the engine, the contract, and
`Order.outcome` are unchanged. cortex is responsible for turning the 2-outcome feed into a 3-way distribution:

- Revive `worker-cortex/src/cortex/dixon_coles.py` (built for exactly this): fit home/away goal expectancies
  from the **Asian-handicap** line (≈ match-result signal) and the **over/under totals** ladder, integrate the
  Poisson/Dixon-Coles score matrix → `P(home win)` / `P(draw)` / `P(away win)`, and emit `fair` keyed
  `{"H","D","A"}` on the existing `prices.marks` topic.
- Rejected: **Option 2** (pivot the live markets to over/under labels). Smallest backend change but it would
  force a rebuild of the entire H/D/A frontend — the product identity is a win/draw/win football exchange.

### 2. MANDATORY quant-reviewer gate; Option-3 replay fallback on the SAME contract

The synthesis is not trusted until the `quant-reviewer` agent signs off on the derivation math. If it cannot
be made correct in time, we fall back to **Option 3**: drive H/D/A marks from the hand-authored **replay** path
(already H/D/A) for the demo. The fallback changes nothing above cortex — the contract, orders, and frontend are
identical; only the mark's source differs. "Live" then honestly means live scores/clock/halts with replayed
prices.

### 3. NEVER a fabricated even book — incomplete `fair` renders UNPRICED, not 33/33/33

This is a hard rule, enforced at the API read boundary regardless of what cortex emits:

- A mark is **complete** iff every one of `H`, `D`, `A` is present and finite (`hasCompleteFair`).
- An incomplete mark (an O/U mark, a partial mark, or a low-confidence synthesis) is treated as **unpriced**:
  `GET /markets` returns `mark: null`; the detail `amm.q` is `null`; `GET /markets/:id/quote` returns `409`;
  portfolio `markPct` is `null` (not `0`). The market shows as not-yet-priced, never a fake uniform book.
- The `?? 1/OUTCOMES.length` uniform fallback in `quote.ts` is removed as a data path. A future cortex
  confidence signal maps a low-confidence live market to `HALTED` (the amber pause), reusing the existing
  lifecycle — no new market state.

### 4. POST /orders intake: thread the single in-proc Engine handle; direct `engine.submit`

Per ADR-004 (one process) the engine already runs in-proc. We stop discarding it: `startEngine` returns the
`Engine`, `main.ts` captures it and passes it to `startHttp` → `registerOrderRoutes`, and the route calls
`engine.submit(matchId, matchId, {kind:"order", …})` directly (the market's own serialized lane, keyed by
match id per the v1 `marketId === matchId` invariant). No new bus topic — a bus intake would be more plumbing
for the same single process.

- **Balance authority** is `Σ CreditLedger.delta` (ADR-003), read via a new `services/balance.ts`. The `bal:`
  Redis key stays a non-authoritative fast cache.
- **Rate limiting** gets a real per-user store (`services/rate-limit.ts`, a Redis zset `orders:recent:{user}`
  trimmed to `RATE_WINDOW_MS`), supplying the `recentOrderTimes` the engine's `RATE_LIMIT` needs (it was inert
  before — nothing maintained that window).
- The engine gains one small, law-safe additive: `SubmitResult.applied: Promise<EngineEffect[]>` resolving with
  the already-computed effects of that command, so the route can answer **200 fill / 4xx typed reject**
  synchronously instead of a blind 202. journal-then-ack, determinism, and the no-http/ws-import law are
  unchanged. Reviewed by `engine-guardian`.

### 5. Play-money invariant holds; SETTLEMENT_LIVE stays FALSE

Orders move **credits only**, through `CreditLedger` + the burned-fee supply counter. No balance/deposit/payout
field; no `bet`/`stake`/`odds`/`wager` vocabulary in copy, params, or code.

## Known ceilings (flagged, not fixed here — follow-ups)

Surfaced by the review pass (engine-guardian PASS on all engine invariants; typescript-reviewer + silent-failure-hunter
found the below). Each is bounded and documented rather than half-fixed:

1. **Fill/mark parity (ADR-042).** The engine fills against its own LMSR `q` (seeded `[0,0,0]`, moved only by
   fills); a mark re-anchors `b`, **not `q`**. A live market's first fills price off a uniform engine book, not
   the displayed mark. Closing this ("guarded engine-emit": re-anchor `q` to the mark while preserving
   fill-induced deviation) is quant-reviewer-gated. This ADR wires intake on the existing AMM; it does not change it.

2. **Balance TOCTOU overspend.** `POST /orders` reads `balance = Σ CreditLedger.delta` in the HTTP layer and bakes
   it into the command; the engine does not re-check it at apply time, and the ledger lags by the async projection.
   Two concurrent orders from one user (or one within the projection window) can each read a pre-debit balance and
   both fill → the ledger can go negative. Inherent to the caller-supplied-balance design (ADR-003/026). A Redis
   lock alone is false confidence (the debit isn't in the ledger when the second order reads it); the correct fix
   is a per-user reservation / balance authority — a future ADR. Play-money-bounded (POSITION_CAP, per-match grants).

3. **Reject-after-timeout invisibility.** If a lane is backed up past `APPLIED_TIMEOUT_MS` (5s), `POST /orders`
   returns 202 "processing"; a reject that resolves after that window is never persisted (reject effects aren't
   projected — `emit.ts` maps only fill/position/ledger/settled). The synchronous path surfaces the common case;
   projecting rejects (an `Order.status="rejected"` row) is the follow-up.

Fixed in this pass from the review: quarantined-lane drops now 409 (never a false "processing"); the rate window
counts only fills + user-fault rejects (a HALTED storm can't rate-limit a real order); `parseScore` rejects
malformed/empty segments (no fabricated 0-0); non-numeric JSON `size`/`limit` are 400; portfolio labels a
HALTED-market position LIVE, not PRE; the applied-race is try/catch-guarded and its timer cleared.

## Consequences

- Frontend, orders, and the contract are H/D/A — the fixture→API swap stays mechanical (see `docs/API-CONTRACT.md`).
- No live market ever shows a fabricated even book; it shows "not priced yet" until a complete mark arrives.
- The trade path is end-to-end (submit → journal → apply → emit → projection → DB/Redis) but fills are not yet
  mark-anchored (ADR-042 follow-up).
- `worker-cortex` owns the risk of the synthesis; the demo is safe via the replay fallback if the math slips.
