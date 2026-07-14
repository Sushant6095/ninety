# Setup

Local development setup for the full Ninety stack — frontend, API + engine, workers, and the Anchor program. For the product story read [README.md](README.md); for system design read [ARCHITECTURE.md](ARCHITECTURE.md).

## Prerequisites

| Tool | Version | Why |
| :--- | :--- | :--- |
| Node.js | **18 or 20** | `apps/api`'s WebSocket layer uses `uWebSockets.js`, which ships prebuilds for these |
| pnpm | **9** | workspace + lockfile (`packageManager: pnpm@9`) |
| Docker | any recent | Postgres 16 + Redis 7 (+ an unused Redpanda) via `docker-compose.yml` |
| Python | **3.11** + venv | only for `apps/worker-cortex` (pricing worker) |
| Rust + Anchor | Anchor **0.30.1** | only for `programs/omnipitch_core` (optional for app development) |

## Quick start (app stack)

```bash
git clone https://github.com/Sushant6095/ninety.git
cd ninety

pnpm install
cp .env.example .env        # the mock + replay run WITHOUT a TxLINE token
docker compose up -d        # postgres (host :5433) + redis (:6379)
pnpm dev                    # turbo runs web + api + workers
```

| Surface | URL |
| :--- | :--- |
| Web (board, Terminal, landing) | http://localhost:3000 |
| REST API | http://localhost:4000 |
| WebSocket gateway | ws://localhost:4001 |

Postgres is deliberately mapped to **host port 5433** so a locally-installed Postgres on 5432 never collides.

```bash
# optional: replay an archived, finished WC26 fixture end-to-end through the ingest plane
./scripts/replay.sh
```

## Environment variables

`cp .env.example .env` gives you a working dev setup with zero secrets. The full table:

| Variable | Used by | Purpose | Required |
| :--- | :--- | :--- | :--- |
| `REDIS_URL` | api, bus, workers | event bus (Redis Streams), engine journal, read models | **Yes** — engine/projection degrade off without it |
| `DATABASE_URL` | api (Prisma) | pooled runtime connection (Supabase pgbouncer pattern in prod) | Yes for DB features |
| `DIRECT_URL` | api (Prisma) | direct connection for `prisma migrate` | Migrations only |
| `BUS_DRIVER` | packages/bus | `redis` (default) or `kafka` (**stub today**) | No |
| `JWT_SECRET` | api auth | session JWT signing | Dev: no (fallback) · **Prod: boot throws if unset** |
| `EMBEDDED_WALLET_SECRET` | api auth | KDF root for invisible custodial wallets | Dev: no · **Prod: boot throws** |
| `ADMIN_TOKEN` | api `/admin/*` | admin gate; **unset = every admin call rejected** (secure default) | No |
| `HELIUS_WEBHOOK_SECRET` | api webhooks | fail-closed verification of `POST /webhooks/helius` | For chain feedback |
| `OMNIPITCH_PROGRAM_ID` | api webhooks | program filter (defaults to the devnet id) | No |
| `SOLANA_CLUSTER` | chain, txline | `devnet` \| `mainnet-beta` (mainnet ids intentionally blank) | No |
| `TXLINE_BASE_URL` / `TXLINE_TOKEN` | packages/txline | live feed origin + token; **the mock runs without them** | Live mode only |
| `ANTHROPIC_API_KEY` | worker-jobs | real AI Booth narration; deterministic template without it | No |
| `TELEGRAM_BOT_TOKEN` / `EARLYWHISTLE_CHANNEL` / `APP_URL` | worker-jobs | EarlyWhistle live match cards (skipped when unset) | No |
| `MOMENTS_ONCHAIN` | worker-jobs | gate for the (cut) cNFT mint — leave off | No |
| `NEXT_PUBLIC_API_URL` | web | REST base URL | Yes for live wiring |
| `NEXT_PUBLIC_WS_URL` | web | WS gateway (`:4001` local, TLS `:8443` on Fly) | For live wiring |
| `WS_PORT` | api | uWS gateway port (default 4001) | No |

## Database

```bash
pnpm --filter api exec prisma migrate dev    # apply migrations (uses DIRECT_URL)
pnpm --filter api exec prisma studio         # inspect
```

Models: `User, Match, Market, Order, Fill, Position, CreditLedger, SettlementSaga, Settlement, Moment, ChainEvent, ProcessedEvent`.

## The Python pricing worker (optional)

`worker-cortex` computes the fair marks (Shin de-vig + hazard). `pnpm dev` will try to run it; give it a venv first or let it no-op:

```bash
cd apps/worker-cortex
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

## The Anchor program (optional)

```bash
cd programs/omnipitch_core
anchor build
anchor test        # 5/5 ts-mocha tests on localnet (leaderboard claim flow)
```

Deployed devnet program: [`6ps8ao7CVhacnRajvFXWTmkknsRnHfEbWmtQ3nDCdBkj`](https://explorer.solana.com/address/6ps8ao7CVhacnRajvFXWTmkknsRnHfEbWmtQ3nDCdBkj?cluster=devnet). Note: `settle_market` is **fail-closed on purpose** (`SETTLEMENT_LIVE = false`) — see the settlement story in the README.

## Static WC26 context (flags, teams, bracket)

Baked at build time into `apps/web/src/data/wc26/*.json` and `apps/web/public/flags/` — **zero network at runtime** (ADR-051, ADR-055). Re-bake only when the source data changes:

```bash
pnpm --filter web wc26:refresh                 # teams/groups/bracket snapshot
node apps/web/scripts/bake-flags.mjs           # flag PNGs (only when FIFA_TO_ISO grows)
```

## Verify your setup

```bash
pnpm lint && pnpm build && pnpm test   # same three commands CI runs
node scripts/ui/axe.mjs                # a11y sweep over every web route (needs the dev server)
node scripts/ui/screenshot.mjs / home  # screenshot harness (needs playwright + chromium)
```

## Production topology (reference)

Web → Vercel (standalone `apps/web` deploy, ADR-048) · API + workers → one Fly.io image, four processes (`api`, `ingest`, `cortex`, `jobs`), WS pinned always-on · Postgres → Supabase (pooler + `DIRECT_URL`) · Redis → Redis Cloud · Solana → devnet + Helius webhook. The whole map with free-tier costs: [`infra/free-tier-map.md`](infra/free-tier-map.md).
