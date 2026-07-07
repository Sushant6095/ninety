# NOW — the only mutable context file (injected into every session by SessionStart)
GOAL: ship the OMNIPITCH vertical slice by Jul 19 (demo recorded during SF Jul 14–15)
DONE: platform bring-up green (build/lint/test · Postgres 5433 + Redis · prisma init · dev boots web:3000/api:4000 /health · law-guard hook) · schema event contract (AnyEvent union) · bus: RedisBus over Streams + driver-agnostic contract suite (order/at-least-once/ack), KafkaBus stub conforms, BUS_DRIVER flip documented. See ADR-007/009/010/011/012; ADRs are immutable-by-policy (adr-scribe rule 5).
DONE(txline) 05 GREEN (world-verified): LIVE devnet subscribe→activate→snapshot printed a real WC fixture (USA v Belgium); IDL-built subscribe (chain), 8 typed wrappers with schemas reshaped to REAL payloads, real samples in docs/txline-samples. Reality wins: devnet=SL1 (SL12=mainnet), F1=/api/fixtures/snapshot, activate→bare-string token, goals from Score.Total.Goals. Mock CI = pnpm test; live = chain/scripts/txline-live.mjs. See ADR-013/014/015 · VERIFY states in .claude/prompts/PROGRAM-STANDARD.md. ⚠ Day-0 left: Stats-map key table.
ACTIVE: 05 GREEN → unblocks 06 ingest+bus (replay) & 07 settlement proof spike (validateStat CPI; IDL + stat-validation now proven)
NEXT 3: 1) north-star screen via /screen match-live  2) ingest+bus walking on replay data  3) engine order path green
BLOCKED: —
(Keep this ≤10 lines. Update it when focus changes; /trace nags if stale.)
