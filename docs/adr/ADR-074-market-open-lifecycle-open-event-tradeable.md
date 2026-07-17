# ADR-074 — Market open lifecycle: the `open` event → tradeable markets (unblocks the play-money loop)

**Status:** Accepted · **Date:** 2026-07-17 · **Extends:** ADR-024 (lifecycle 7×7 reducer), ADR-071 (POST /orders intake) ·
**Touches:** ADR-010 (AnyEvent union), ADR-003 (CreditLedger is balance authority), ADR-027 (read-model projection).

## Context
`POST /orders` on the seeded live match `18241006` returned **409 MARKET_HALTED**. Root cause traced this session:
`engine/market.ts` seeds every market **SCHEDULED** (`initialMarket`) and `canAcceptOrder` accepts only OPEN/LIVE. Nothing
ever fired the `open` control trigger — `fromEnvelope()` mapped no event to `open`, and the normalizer explicitly **defers**
the GameState→kickoff/ht/ft mapping. So no market left SCHEDULED via any runtime path: the ADR-071 fill path was
unreachable end-to-end. Separately, `/portfolio` showed `free: 0` despite a real 1000-credit per-match grant.

## Decision
1. **Add an `open` lifecycle event.** New `open` EventType (`packages/schema/src/envelope.ts`) + an `OpenEvent` variant
   (`EnvelopeBase + type:"open" + StatusPayload`) in the AnyEvent union and `PAYLOAD_BY_TYPE`, with a round-trip corpus entry.
2. **One case in `fromEnvelope()`:** `type "open" → { trigger: "open", at }`, mapping the event to the trigger the machine
   **already** supports (SCHEDULED --open--> OPEN). No change to the 7×7 table, `canAcceptOrder`, or any other engine logic.
   A market becomes tradeable through the real lifecycle when an `open` event arrives (the deferred normalizer emits it in
   prod; a local demo emits it now).
3. **Demo-only seed** (`apps/worker-ingest/src/push-demo-ticks.ts`, sibling of `prisma/seed-demo.ts`): publishes one O/U +
   one Asian-handicap odds tick (so cortex synthesizes the 1X2 mark, ADR-071) and one `open` match event, all through the
   existing `createBus`/`createPipeline`/`ingestOdds` path — not a runtime engine writer. Needs a PG `Market` row with
   `id==matchId==fixtureId`, kind `1X2`, so the synth mark (keyed by fixtureId) joins.
4. **Read-model fix:** `services/portfolio.ts` `free` now reads authoritative `Σ CreditLedger.delta` via `getBalance()`
   (ADR-003) instead of the stale `bal:` Redis cache. The grant writes CreditLedger but never updated `bal:`, so
   `/portfolio` reported `free:0` against a real grant.

## Invariants upheld (engine-guardian PASS)
Single-writer (no new writer; `open` + orders share the `match_id` lane), journal-then-ack unchanged, determinism (`at` from
`env.ts_source`, no wall clock in apply), `amm.ts` pure, no http/ws import in engine, HALTED still rejects MARKET_HALTED,
`open` only takes SCHEDULED→OPEN (noop/parked elsewhere), settlement/on-chain path untouched.

## Verification (local prod-parity API)
`18241006` priced with a real 1X2 mark (H 0.516 / D 0.278 / A 0.206); `POST /orders` buy H 10 → **200 fill** (price 0.337);
`/portfolio` → free **996.63** (1000 − 3.37) + the position (10 shares, +53% P&L); `/orders` lists the fill.
api tsc clean · 145 api tests · 10 schema tests · engine-guardian PASS.

## Consequences / known follow-ups (non-blocking)
- The play-money loop (open → price → fill → portfolio) is now reachable end-to-end on a seeded live match.
- **Lifecycle effects are not projected to Postgres `Market.status`** (`emit.ts` omits open/live/halt/reopen/resolving/voided)
  — a consumer reading `Market.status` can show stale status for an actually-OPEN market. Fix = a lifecycle-topic projection
  (ADR-027 scope); its own ADR.
- The demo push uses a fixed `source_seq` (one-shot; re-runs are idempotent no-ops, not repeatable ticks).
