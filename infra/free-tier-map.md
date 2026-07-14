# Where everything runs (hackathon → 5k users) and what it costs
| Piece | Service | Tier | Notes |
|---|---|---|---|
| web | Vercel | free | Next.js native |
| api+engine+ws (+workers as processes) | Fly.io 1x shared-cpu | ~$0–5/mo | always-on needed for WS; Render free sleeps — avoid |
| worker-cortex | same Fly VM (process) | $0 | Python alongside via supervisor/compose |
| Postgres | Supabase | free 0.5GB | app uses the POOLER url (pgbouncer, :6543, connection_limit=1); migrations use DIRECT_URL (:5432) or they hang — see schema.prisma + SETUP-LIVE.md |
| Redis (cache+bus+resume) | Redis Cloud | free 30MB | NOT Upstash — Upstash free caps ~10k cmds/day and a live tape burns that in minutes; our bus is Redis Streams |
| Kafka | — none — | $0 | ADR-007: Redis Streams until trigger |
| Solana | devnet + Helius | free | 1 RPC key; webhooks on free plan |
| Object storage (moment PNGs, tick archive) | Cloudflare R2 | free 10GB | |
| LLM/TTS booth | Anthropic + TTS API | pay-per-use | pennies at hackathon volume |
Total steady state: ≈ $0–5/month until real traction.
