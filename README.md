# OMNIPITCH
A free-to-play stock market for live football. Prices from TxLINE consensus odds, AI commentary on every swing, results settled trustlessly on Solana by verifying TxLINE's cryptographic proofs. Strictly play-money.

## Start here (new dev: 10 minutes)
1. `pnpm install`
2. `cp .env.example .env` and fill `TXLINE_TOKEN`
3. `docker compose up -d`   (postgres + redis)
4. `pnpm dev`               (turbo runs web + api + workers)
5. Read `CLAUDE.md`, then `docs/adr/` (6 short decisions = the whole architecture)

## The layer map — every folder answers "which layer am I?"
| Layer | Folder | Runs on (free tier) | Talks to |
|---|---|---|---|
| L6 Frontend | `apps/web` | Vercel (free) | api REST + WS only. Never DB, never chain writes. |
| L5 Edge + L3 Engine | `apps/api` | Fly.io small VM | Redis, Postgres, bus. Owns the single-writer trading engine. |
| L1 Ingestion | `apps/worker-ingest` | same VM / tiny VM | TxLINE (via `packages/txline`) → bus. No business logic. |
| L3 Pricing | `apps/worker-cortex` (Python) | same VM | bus in → fair marks + hazard out. |
| L3/L4 Jobs | `apps/worker-jobs` | same VM | Settlement saga → Solana (via `packages/chain`), moments, notify. |
| L0 Blockchain | `programs/omnipitch_core` | Solana devnet (free) | Verifies TxLINE proofs on-chain. Trust only — never trading. |
| Contracts | `packages/*` | — | schema (event types), bus (Redis Streams↔Kafka), txline, chain. |

## Data-flow contract (memorize these 5 lines)
1. Every input becomes a **canonical envelope** (`packages/schema`) on the **bus** (`packages/bus`). No service calls another service directly — events only.
2. **Frontend** reads cold data over REST, hot data over WS channels with seq-resume. It renders; it never computes prices.
3. **Postgres** is durable truth (Prisma, `apps/api/prisma`). **Redis** is hot state + bus + WS resume buffers. Cache derives from events, never the reverse.
4. **The engine** (`apps/api/src/engine`) is the ONLY writer of market state. One logical writer per market. Nothing in `engine/` imports from `http/` or `ws/`.
5. **Solana** holds only what needs trust: market registry, proof-verified results, leaderboard roots, point claims, Moment cNFTs. The backend *forwards* TxLINE's proof; the **program verifies it** (`proof.rs`). Chain events flow back via Helius webhook → bus → WS.

## Scale path (graduation triggers, not guesses)
- 0→5k users: everything above, one small VM + Vercel + Neon + Upstash. ~$0–5/mo.
- >2k concurrent WS or >5k msg/s: extract `ws/` to its own Fly app ×2 (folder already isolated); flip `BUS_DRIVER=kafka` (Redpanda Cloud) — code unchanged, `packages/bus` swaps driver.
- >20k concurrent: engine shards by match_id across processes (already single-writer per market); Neon → bigger tier; add read replicas.
- 100k customers ≈ 10–20k peak concurrent: 2–3 WS nodes + 1 engine node + managed Kafka. Architecture unchanged — that is the point.

## Judged artifacts live here from day one
`docs/SUBMISSION.md` (tech doc + TxLINE feedback) · `docs/demo/script.md` · `design/screens/` · `scripts/replay.sh` (one-command demo).
