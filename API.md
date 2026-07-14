# API

The `apps/api` surface: REST for cold reads and auth, WebSocket for hot data, the event bus for everything between services. Captured sample payloads live in [`docs/api-samples/`](docs/api-samples/).

Base URLs — local: `http://localhost:4000` (REST) · `ws://localhost:4001` (WS). Fly: REST on `:4000`, WS behind TLS `:8443`.

## REST

Auth is a JWT (`Authorization: Bearer …`) issued by either auth flow below. Public reads need no token.

### Auth

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `POST` | `/auth/embedded/start` | email + OTP start — provisions an invisible custodial wallet (dev logs the code; prod requires a mail sender) |
| `POST` | `/auth/embedded` | verify OTP → JWT |
| `POST` | `/auth/embedded/export` | export the embedded wallet key (power users leaving custody) |
| `GET` | `/auth/challenge` | challenge for wallet sign-in (Phantom/Backpack) |
| `POST` | `/auth/connect` | verify wallet signature → JWT |
| `GET` | `/auth/me` | current user |

### Markets & read models

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `GET` | `/health` | liveness |
| `GET` | `/markets` | all markets (board data) |
| `GET` | `/markets/:matchId` | one market + mark-implied AMM state (`{status, mark, amm:{q, b, spread_mult}}`) so a client can price locally between ticks |
| `GET` | `/markets/:matchId/quote` | LMSR quote for a prospective trade (ADR-046) |
| `GET` | `/leaderboard` | global leaderboard (Redis zset read model, ADR-027) |
| `GET` | `/portfolio` | open positions + equity for the authed user |

### Chain & ops

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `POST` | `/webhooks/helius` | Helius enhanced-tx webhook: fail-closed secret check → idempotent `chain_events` record → `settled` envelope on the bus (source=chain, ADR-034) |
| `POST` | `/admin/replay` | `x-admin-token`-gated (constant-time compare; **unset token = every call rejected**) → publishes a `replay_request` system signal |

**Honest scope:** there is **no order-submission HTTP endpoint yet** — `routes/orders.ts` is a stub. The engine's order path (risk gate → LMSR fill → burned fee → ledger effects, ADR-026) is fully implemented, journaled, and covered by tests, but today it is only exercised by tests and the quote endpoint; wiring a `POST /orders` surface is on the [roadmap](ROADMAP.md).

## WebSocket

One gateway (`uWebSockets.js`), frame shape `{ch, seq, t, d}`. Subscribe with:

```json
{ "op": "sub", "ch": ["m:wc26-can-mar:prices", "lb:global"], "since": { "m:wc26-can-mar:prices": 1041 } }
```

| Channel | Feeds from | Carries |
| :--- | :--- | :--- |
| `m:{matchId}:prices` | `prices.marks.v1` | fair mark, hazard, LMSR `bHint` — the live price |
| `m:{matchId}:events` | `match.events.v1` | goals, halts, status changes |
| `m:{matchId}:booth` | `commentary.v1` | AI Booth lines |
| `lb:global` | leaderboard projection | rank movements |

`since`-based backfill is a declared follow-up; today the gateway is live fan-out with monotone `seq` for gap detection. The WS bridge never imports engine or HTTP code.

## The event bus (service-to-service)

All inter-service traffic flows through `packages/bus` (a repo law — no service calls another directly). One typed interface, two planes:

**Domain events** — zod-validated `Envelope`s, idempotent, partition-keyed:

```
fixtures.v1 · odds.raw.v1 · match.events.v1 · prices.marks.v1 · orders.v1
fills.v1 · positions.v1 · credits.v1 · commentary.v1 · settlement.v1
```

**System signals** — `SysEvent` (`kind`, not `type`; no idempotency semantics) on `sys.signals.v1`: `feed_gap`, `backpressure`, `replay_request`, … The `PayloadOf<T>` type makes a wrong-plane handler a compile error.

Transport: Redis Streams with consumer groups (`XREADGROUP` + `XAUTOCLAIM` reclaim), at-least-once. `BUS_DRIVER=kafka` selects a driver that is **a stub today** — the interface is the contract, the flip is an ADR away (ADR-007/020).

## TxLINE (upstream, wrapped)

Every TxLINE/TxODDS call goes through `packages/txline` — typed wrappers, zod parsing, seq-gap detection, and a deterministic mock that serves real captured payloads from [`docs/txline-samples/`](docs/txline-samples/). The endpoint map and auth flow (guest JWT → on-chain Token-2022 subscribe → activate) are documented in the [README](README.md#txline-api--the-data-spine--primary-highlight) and [`docs/TXLINE-MAP.md`](docs/TXLINE-MAP.md).
