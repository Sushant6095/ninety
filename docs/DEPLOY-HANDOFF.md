# DEPLOY-HANDOFF (ADR-072)

What was built this pass, the credentials still gated on you, and the exact Mac verify sequence. **The Verification
law binds: the FE is verified on a LOCAL PRODUCTION build + screenshot, never dev/Vercel-preview.** Nothing below
was booted in the build sandbox (Mac-native `node_modules`, no Docker) — the cortex synthesis was fully tested
(18/18 pytest) and all new TS was syntax-checked; the stack boot + curl happen here on the Mac.

---

## 1. Secrets — env only, NEVER committed (`.env*` is gitignored — confirmed)

Put these in `apps/api/.env` (and the deploy provider's secret store). Do NOT paste any real value into a tracked
file, a commit, or chat history beyond what's already there.

| Env var | Status | Notes |
|---|---|---|
| `API_FOOTBALL_KEY` | ✅ **saved to `apps/api/.env`** | api-sports.io v3, 100 req/DAY. Wired: `/rich/lineups`, `/rich/players`, `/rich/injuries`. |
| `SPORTMONKS_TOKEN` | ✅ **saved to `apps/api/.env`** | Sportmonks v3 football. NOT yet wired into the proxy — tell me what to pull from it (livescores/lineups/xG/standings) and I add it as a 3rd source. |
| `FOOTBALL_DATA_TOKEN` | ✅ **saved to `apps/api/.env`** | football-data.org, 10 req/min. Wired: `/rich/standings`, `/rich/scorers`, `/rich/teams`, `/rich/h2h`. |
| `DATABASE_URL` + `DIRECT_URL` | 🟡 **schema applied** — project `ninety's Project` (`atpctubvfyknizwqbtyl`, ap-northeast-2). All 13 tables live via the Supabase MCP (4 Prisma migrations). STILL NEED the connection strings (DB password) in `.env` for the app to connect: pooler `:6543?pgbouncer=true&connection_limit=1` + direct `:5432`. Do NOT `prisma migrate deploy` against Supabase — schema is already there. |
| `REDIS_URL` | ⏳ Redis Cloud | 30MB free (NOT Upstash). |
| `TXLINE_NETWORK` (+ funded wallet) | ⏳ | devnet SL1 carries the live England v Argentina fixture `18241006`. Ingest only signs activation, never spends. |
| `JWT_SECRET`, `EMBEDDED_WALLET_SECRET` | ⏳ prod | `assertSecretsAtBoot()` fails fast without them. |
| `TELEGRAM_BOT_TOKEN` | ⏳ | EarlyWhistle (worker-jobs) — the AI Pundit Bot. @BotFather. |
| `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_USE_FIXTURES` | ⏳ web | API `:4000`, WS `:4001`; `USE_FIXTURES=1` for offline demo. |

Assets (not secrets, still gated): rights-free atmosphere video/stills + a rigged GLTF for the dribbler — will NOT
ship the capsule 3D or fabricated imagery.

---

## 2. Prisma migration (run first — the routes need the new models)

```bash
cd apps/api
npx prisma migrate dev --name add_pick_and_moment_fields   # generates + applies: Pick model, Moment.createdAt/swing/market
npx prisma generate                                        # regenerate the client so moments.ts/games.ts typecheck
```
Non-destructive: `Pick` is new; `Moment` gains nullable `swing`, defaulted `createdAt`, and a `market` FK on the
existing `marketId`. Existing rows are unaffected.

---

## 3. Boot the stack + verify (local, per the Verification law)

```bash
pnpm install
docker compose up -d                       # postgres :5433, redis :6379
pnpm --filter @omnipitch/api dev           # API :4000, WS :4001 (run on Node 18/20 for the uWS transport)
pnpm --filter @omnipitch/worker-cortex dev # cortex → prices.marks (the synthesized 1X2)
```

### 3a. Cortex synthesis (already green in-sandbox; re-run on Mac with penaltyblog for the full suite)
```bash
cd apps/worker-cortex
pytest tests/test_synth.py tests/test_synth_marks.py -q    # 18/18 (the crown jewel — no penaltyblog needed)
pytest -q                                                   # full suite (devig/pricing need penaltyblog from the venv)
```

### 3b. curl every new endpoint against :4000 (match docs/API-CONTRACT.md 1:1)
```bash
API=http://localhost:4000
curl -s $API/health
curl -s $API/moments | jq '.moments[0]'
curl -s "$API/search?q=arg" | jq
curl -s $API/matches/18241006/events | jq '.events[0]'
curl -s $API/matches/18241006/actions | jq '.actions[0]'
curl -s $API/rich/standings/2000 | jq '.source, .cached'      # 503 needs:FOOTBALL_DATA_TOKEN until keyed
curl -s $API/rich/lineups/12345 | jq '.source, .cached'       # API-Football (gap-only)
# auth-gated (need a Bearer jwt):
TOKEN=...; curl -s -H "Authorization: Bearer $TOKEN" $API/games/picks | jq
curl -s -XPOST -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
     -d '{"matchId":"18241006","choice":"home"}' $API/games/picks | jq
```
Expected: moments/search/events/actions return their contract shapes; rich returns `{source,cached,data}` or the
honest `503/429/502`; picks create + list. **No endpoint returns a fabricated even book or a dead proof link.**

---

## 4. CONNECT swap (the remaining FE step — clears the last no-dead-code (b))

`apps/web/src/lib/api.ts` is the real typed client (built this pass; `wsConnect` re-exports the resume WS). ~30 FE
surfaces still import baked fixtures. Swap each to the client (or a thin `lib/data` branch on `USE_FIXTURES`), using
`docs/API-CONTRACT.md` as the field map. Then, per the Verification law:
```bash
pnpm --filter web build && pnpm --filter web start        # PRODUCTION build, not next dev
node scripts/ui/screenshot.mjs                            # lg + xl, SETTLE wait
```
LOOK at the shots · read-out-loud test · design-cop verdict to `design/verdicts/`. The River `canvas.width !== 300`
guard still applies. When done, `bash .claude/hooks/no-dead-code.sh </dev/null` returns clean (no block).

---

## 5. Blockchain (P3, after the API is live)
`anchor deploy` to devnet (program is BUILT, not deployed — AccountNotFound), then real ProofBadge reads
(@solana/web3.js), wallet auth, leaderboard roots. `SETTLEMENT_LIVE` stays **false** (the forge, ADR-036/037) until
TxODDS confirms finality binding. Ingest can never spend SOL.

---

## 6. Fly deploy — authoritative secrets + commands (ADR-072 audit)

Config already exists and is correct: `infra/fly/fly.toml` + `infra/fly/Dockerfile` (one image, Node 20 + Python
3.11; four process groups api·ingest·cortex·jobs; WS on :4001; persistent machines). **Do NOT `fly launch`** — it
would clobber them. Deploy from the **repo root**. The secrets list below is audited from the code (the old fly.toml
comment had a phantom `TXLINE_TOKEN` and missed the real TxLINE token vars — now fixed).

```bash
fly apps create omnipitch                          # or check first: fly apps list
fly secrets set -c infra/fly/fly.toml \
  DATABASE_URL="<supabase POOLER ...:6543/postgres?pgbouncer=true&connection_limit=1>" \
  DIRECT_URL="<supabase DIRECT db.<ref>.supabase.co:5432/postgres>" \
  REDIS_URL="<redis cloud redis://...>" \
  TXLINE_NETWORK=devnet \
  TXLINE_DEVNET_JWT="<apps/api/.env, after scripts/txline-devnet-argeng.mjs>" \
  TXLINE_DEVNET_API_TOKEN="<apps/api/.env>" \
  JWT_SECRET=$(openssl rand -hex 32) \
  EMBEDDED_WALLET_SECRET=$(openssl rand -hex 32) \
  ADMIN_TOKEN=$(openssl rand -hex 24)
fly deploy -c infra/fly/fly.toml                   # build + release (repo root)
fly logs   -c infra/fly/fly.toml                   # confirm all four groups green
```

- **REQUIRED (won't boot without):** `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `JWT_SECRET`, `EMBEDDED_WALLET_SECRET`.
- **TxLINE ingest:** `TXLINE_NETWORK=devnet` + the two pre-obtained tokens (deployed worker never signs SOL).
- **OPTIONAL (degrade gracefully):** `ANTHROPIC_API_KEY` · `TELEGRAM_BOT_TOKEN`+`EARLYWHISTLE_CHANNEL` ·
  `HELIUS_WEBHOOK_SECRET` · `MOMENTS_ONCHAIN` · `OMNIPITCH_PROGRAM_ID`+`SOLANA_CLUSTER` · `APP_URL`.
- Already in `fly.toml [env]` (not secrets): `NODE_ENV`, `BUS_DRIVER=redis`, `WS_PORT=4001`.
- **Schema is already on Supabase** (applied via the Supabase MCP — project `atpctubvfyknizwqbtyl`) → **do NOT**
  `prisma migrate deploy`; the Dockerfile only runs `prisma generate`.
- The Fly MCP has **no `deploy` tool** (it exposes apps/secrets/machines/logs/status/volumes) — so `fly deploy` runs
  as the CLI command while the MCP orchestrates app-create + secrets + log-checking.
- **Remaining gates: just two URLs** — the Supabase connection strings + a Redis Cloud instance. Everything else
  generates inline.

---

## Status snapshot (updated)
- **P1 backend:** ✅ done + verified on Mac (all endpoints curled, cortex 27/27, tsc clean, dead-code hook clean).
  The market-open lifecycle + credit-grant fix landed (engine-guardian PASS); the full trade loop is proven on the
  live API (open → `POST /orders` fill → `/portfolio` +53% → `/orders`).
- **P2 deploy:** Supabase schema ✅ live · Fly config ✅ authoritative · Vercel FE live. Gated on: Supabase
  connection strings + Redis URL, then `fly deploy`.
- **P3 Solana:** program built, **not deployed** to devnet (Mac + wallet). ProofBadge/wallet-auth pending.
- **P4 richness:** rich-data proxy ✅ (3 providers keyed). Imagery/3D/depth-tabs/Telegram pending.
- **CONNECT (FE):** read-model surfaces live + prod-verified; the interactive live-match slice is the store-seam
  pass (in progress on the terminal).
