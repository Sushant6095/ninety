# NOW — the only mutable context file (injected into every session by SessionStart)
GOAL: ship the OMNIPITCH vertical slice by Jul 19 (demo recorded during SF Jul 14–15)
DONE: platform bring-up green (build/lint/test · Postgres 5433 + Redis · prisma init · dev boots web:3000/api:4000 /health · law-guard hook) · schema event contract (AnyEvent union) · bus: RedisBus over Streams + driver-agnostic contract suite (order/at-least-once/ack), KafkaBus stub conforms, BUS_DRIVER flip documented. See ADR-007/009/010/011/012; ADRs are immutable-by-policy (adr-scribe rule 5).
DONE(txline): auth flow (guest→subscribe→sign→activate · both headers · cache/refresh · network guard) + 8 typed wrappers (scores/odds/fixtures snapshot·updates·SSE stream·stat-validation → parsed zod, not any) + statkeys; verify drives all 8 vs mock (= pnpm test); 8 samples in docs/txline-samples; TXLINE-MAP §1 + SUBMISSION filled. See ADR-013/014. Day-0 left: confirm 4 ⚠ paths + full statKey table + subscribe IDL.
ACTIVE: Day-0 TxLINE study → /spike-proof (settlement verification, Plan A vs B)
NEXT 3: 1) north-star screen via /screen match-live  2) ingest+bus walking on replay data  3) engine order path green
BLOCKED: —
(Keep this ≤10 lines. Update it when focus changes; /trace nags if stale.)
