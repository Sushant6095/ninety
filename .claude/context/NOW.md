# NOW — the only mutable context file (injected into every session by SessionStart)
GOAL: ship the OMNIPITCH vertical slice by Jul 19 (demo recorded during SF Jul 14–15)
DONE: platform bring-up green (build/lint/test · Postgres 5433 + Redis · prisma init · dev boots web:3000/api:4000 /health · law-guard hook) · schema event contract (AnyEvent union) · bus: RedisBus over Streams + driver-agnostic contract suite (order/at-least-once/ack), KafkaBus stub conforms, BUS_DRIVER flip documented. See ADR-007/009/010/011.
ACTIVE: Day-0 TxLINE study → /spike-proof (settlement verification, Plan A vs B)
NEXT 3: 1) north-star screen via /screen match-live  2) ingest+bus walking on replay data  3) engine order path green
BLOCKED: —
(Keep this ≤10 lines. Update it when focus changes; /trace nags if stale.)
