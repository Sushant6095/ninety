# Where everything runs (hackathon → 5k users) and what it costs
| Piece | Service | Tier | Notes |
|---|---|---|---|
| web | Vercel | free | Next.js native |
| api+engine+ws (+workers as processes) | Fly.io 1x shared-cpu | ~$0–5/mo | always-on needed for WS; Render free sleeps — avoid |
| worker-cortex | same Fly VM (process) | $0 | Python alongside via supervisor/compose |
| Postgres | Neon | free 0.5GB | autosuspend ok; Prisma pooling |
| Redis (cache+bus+resume) | Upstash | free | flip to same-VM redis if command limits bite |
| Kafka | — none — | $0 | ADR-007: Redis Streams until trigger |
| Solana | devnet + Helius | free | 1 RPC key; webhooks on free plan |
| Object storage (moment PNGs, tick archive) | Cloudflare R2 | free 10GB | |
| LLM/TTS booth | Anthropic + TTS API | pay-per-use | pennies at hackathon volume |
Total steady state: ≈ $0–5/month until real traction.
