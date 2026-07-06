# NOW — the only mutable context file (injected into every session by SessionStart)
GOAL: ship the OMNIPITCH vertical slice by Jul 19 (demo recorded during SF Jul 14–15)
DONE: repo bring-up green — pnpm install/build/lint/test pass · Postgres(5433)+Redis up · prisma init migration applied · pnpm dev boots web:3000 + api:4000 (/health 200) · law-guard hook verified (blocks raw hex). See ADR-009.
DONE(schema): typed event contract — 15 zod payloads + AnyEvent discriminated union + PAYLOAD_BY_TYPE + parse helpers in packages/schema; round-trip tests green; api/ingest build. See ADR-010.
ACTIVE: Day-0 TxLINE study → /spike-proof (settlement verification, Plan A vs B)
NEXT 3: 1) north-star screen via /screen match-live  2) ingest+bus walking on replay data  3) engine order path green
BLOCKED: —
(Keep this ≤10 lines. Update it when focus changes; /trace nags if stale.)
