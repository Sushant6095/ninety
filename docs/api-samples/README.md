# API samples — the frontend contract (Home vertical slice)

Real response shapes for the endpoints the Home screen consumes. These are the contract the screen turn
builds against. Generated 2026-07-09.

## Verification status (honest)
Run `pnpm --filter @omnipitch/api exec tsx scripts/verify-live.ts` — it exercises the real code against the
**live Redis + bus** (no secrets needed). Result: **5/5 green**.

| Sample | Endpoint | How it was produced | Status |
|---|---|---|---|
| `leaderboard.json` | `GET /leaderboard` | live `getLeaderboard(redis)` over a seeded `lb:global` zset | ✅ **live** (exact endpoint payload) |
| `market-mark.json` | (markets-read cache) | live `prices.marks` → Redis `market:{id}` → `getMark(redis)` | ✅ **live** |
| `ws-prices-frame.json` | WS `m:{match}:prices` | live `prices.marks` → `attachBridge` frame (seq, ~1ms) | ✅ **live** (bridge mapping) |
| `markets-list.json` | `GET /markets` | Prisma `Market ⨝ Match` shape + the live-verified `mark` | ◻ shape exact; HTTP curl gated by `DATABASE_URL` |
| `market-detail.json` | `GET /markets/:match` | same + `amm` | ◻ shape exact; `amm.q`/`spread_mult` pending engine-emit |

## What's live vs gated (no faking)
- **Live-verified against real infra:** the markets-read price cache (`prices.marks` → Redis), the leaderboard
  read (`lb:global` zset → ranked rows), and the WS bridge mapping (`prices.marks` → seq'd `m:{match}:prices`
  frame, sub-second). These are the novel/risky parts and they work.
- **Gated by the security hook:** `GET /markets` and `GET /markets/:match` read Postgres via Prisma, which needs
  `DATABASE_URL` from `.env`. The hook (correctly) blocks handling `.env`, so the running-server curl can't be
  done from here — the shapes above are exact (typechecked + composed from the verified mark). To curl them, boot
  the API with its env on Node 18/20 (see below).
- **uWS transport:** `uWebSockets.js` ships prebuilt binaries only for Node LTS 16/18/20; this env is Node 24, so
  the live socket can't bind here (the gateway degrades gracefully; the bridge mapping is verified independently).
  Run the API on Node 18/20 for the live socket + a `wscat` check.

## amm shape (ADR-042)
`amm.b` is real (the LMSR liquidity the live mark implies). `amm.q` (shares outstanding) and `amm.spread_mult`
live only in the engine's journaled state and are returned `null` until a guarded engine-emit exposes them — a
Match-view/trade-sheet task, not needed for Home.
