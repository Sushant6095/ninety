# SETUP-LIVE.md — take Ninety live in ~15 minutes

Everything that needs **no** credential is already done (ITEM 11): Fly config (4 processes, Node 20 pinned),
Prisma pooler/direct split, Redis-Cloud/Supabase decisions, the Supabase MCP entry, and the API-Football bake
script. This page is the human-only remainder: create four free accounts, paste keys, run the commands.

> **Secrets rule:** keys go in `.env` (git-ignored) and `fly secrets` only. The repo is PUBLIC — never commit a
> real value. Every name below is already referenced by code; you are only supplying values.

---

## 0. Prereqs
```bash
source ~/.nvm/nvm.sh && nvm use 20   # uWebSockets.js needs Node 18/20, NOT 22/24
pnpm install
cp .env.example .env 2>/dev/null || true   # then fill the names below
```

## 1. Supabase (Postgres) — ~4 min
1. Sign up at https://supabase.com → **New project** (region close to Fly `iad`, e.g. East US). Save the DB password.
2. Project → **Connect** → **ORMs / Prisma**. Copy the two URLs:
   - **Transaction pooler** (`...pooler.supabase.com:6543/postgres`) → append `?pgbouncer=true&connection_limit=1`
   - **Direct** (`db.<ref>.supabase.co:5432/postgres`)
3. Put them in `.env`:
   ```env
   DATABASE_URL=postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   DIRECT_URL=postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres
   ```
4. Create the tables (migrations run over `DIRECT_URL` — through the pooler they hang forever):
   ```bash
   pnpm --filter @omnipitch/api exec prisma migrate deploy
   ```

## 2. Redis Cloud (bus + cache + resume) — ~3 min
Use **Redis Cloud free 30MB**, NOT Upstash (Upstash free caps ~10k cmds/day; a live tape burns that in minutes).
1. Sign up at https://redis.com/try-free/ → create a free **30MB** database.
2. Copy its endpoint + password into `.env`:
   ```env
   REDIS_URL=redis://default:<pw>@<host>.redns.redis-cloud.com:<port>
   ```

## 3. API-Football (Lineups tab — names/numbers/formation) — ~2 min
TxLINE carries no lineups/names (see `docs/TXLINE-MAP.md §6`); this is the stillness source (ADR-051).
1. Sign up at https://www.api-football.com/ (free tier, 100 req/day). Copy the API key.
2. Bake once and commit the result (it is NEVER a runtime dependency):
   ```bash
   API_FOOTBALL_KEY=<key> node scripts/bake-lineups.mjs      # → apps/web/public/wc26/lineups.json
   git add apps/web/public/wc26/lineups.json && git commit -m "chore(web): bake WC26 lineups"
   ```
   (Wiring the file into the frozen `apps/web` Lineups tab is a follow-up — the tab already renders formation +
   positions from static data, so this only upgrades placeholder names to real ones.)

## 4. Other app secrets — set once
```env
TXLINE_TOKEN=          # from the TxLINE devnet handshake (already proven — ADR-015)
TXLINE_BASE_URL=https://txline-dev.txodds.com
JWT_SECRET=            # openssl rand -hex 32
EMBEDDED_WALLET_SECRET=# openssl rand -hex 32
ADMIN_TOKEN=           # openssl rand -hex 32
ANTHROPIC_API_KEY=     # OPTIONAL — booth falls back to a template narrator without it
```

## 5. Fly.io — deploy the 4-process backend — ~5 min
The api VM never sleeps (`auto_stop_machines="off"`), so the uWS live feed stays connected. One image runs four
process groups: **api + worker-ingest + worker-cortex (Python — no cortex = no prices) + worker-jobs**.
```bash
brew install flyctl && fly auth login
fly launch --no-deploy --copy-config --name omnipitch -c infra/fly/fly.toml   # from REPO ROOT (monorepo = build context)

# push every secret (values from steps 1–4; never in a committed file)
fly secrets set \
  DATABASE_URL='...' DIRECT_URL='...' REDIS_URL='...' \
  TXLINE_TOKEN='...' TXLINE_BASE_URL='https://txline-dev.txodds.com' \
  JWT_SECRET='...' EMBEDDED_WALLET_SECRET='...' ADMIN_TOKEN='...' \
  -c infra/fly/fly.toml

fly deploy -c infra/fly/fly.toml
fly logs -c infra/fly/fly.toml        # confirm all four process groups boot; cortex prints prices
```

## 6. Supabase MCP (optional, for AI DB access) — set the env var
`.mcp.json` already has the `supabase` server with an env-var placeholder. Provide the token + project ref:
```bash
export SUPABASE_ACCESS_TOKEN=sbp_...   # Supabase → Account → Access Tokens (a PAT, NOT the anon/service key)
# edit .mcp.json: replace YOUR_SUPABASE_PROJECT_REF with your project ref (the <ref> from step 1)
```
It runs read-only (`--read-only`). The token is read from the environment — never write it into `.mcp.json`.

## 7. Point the web app at the live API (only after step 5 is verified)
Kept behind a flag so the prototype still renders if the API is down:
```env
NEXT_PUBLIC_USE_FIXTURES=false        # true = static fixtures (default); false = live api
NEXT_PUBLIC_API_URL=https://omnipitch.fly.dev
NEXT_PUBLIC_WS_URL=wss://omnipitch.fly.dev:8443
```

---

### Env var checklist
| Var | Where | Notes |
|---|---|---|
| `DATABASE_URL` | Supabase pooler | `:6543` + `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Supabase direct | `:5432` — migrations only, or they hang |
| `REDIS_URL` | Redis Cloud 30MB | bus is Redis Streams; not Upstash |
| `API_FOOTBALL_KEY` | API-Football free | bake-time only, never runtime (ADR-051) |
| `TXLINE_TOKEN` / `TXLINE_BASE_URL` | TxLINE devnet | scores/odds/settlement — the only feed that MOVES |
| `JWT_SECRET` / `EMBEDDED_WALLET_SECRET` / `ADMIN_TOKEN` | `openssl rand -hex 32` | — |
| `ANTHROPIC_API_KEY` | Anthropic | optional; booth degrades gracefully |
| `SUPABASE_ACCESS_TOKEN` | Supabase PAT | MCP only; env var, never in `.mcp.json` |
