# PROGRAM-STANDARD

Process rules for the OMNIPITCH build program. Append, never rewrite.

## VERIFY has three states

- **GREEN** — verified against the real world (live API hit, on-chain tx confirmed, real payload printed).
- **YELLOW** — logic verified, world-contact pending. A YELLOW result **must name the exact unblock** (the specific credential, endpoint, address, or file that is missing).
- **RED** — not working.

**Yellow may not be built upon when the next prompt depends on the world-facing part.** Prompts 06–08, and especially 07, require **05 GREEN, not yellow**.

Why: a plausible-but-unverified integration ("the code is right, I just can't reach the API") reads as done and silently rots the prompts built on top of it. Name the unblock, keep it yellow, and don't let downstream work assume the world-facing part works until it actually has.

## Prompt status ledger

| # | Scope | State | Evidence / unblock |
|---|-------|-------|--------------------|
| 01 | monorepo bring-up (build/test/dev/hooks) | GREEN | `/health` 200, hook block shown (ADR-009) |
| 02 | schema event contract (AnyEvent) | GREEN | round-trip tests (ADR-010) |
| 03 | RedisBus over Streams | GREEN | integration test vs docker redis (ADR-011) |
| 04 | driver-agnostic bus contract suite | GREEN | contract green on redis + typecheck (ADR-012) |
| 05 | TxLINE client + typed wrappers | **GREEN (world-verified)** | LIVE 2026-07-07 on devnet: subscribe tx `2RMQS9tY…`, activate 200, `GET /api/fixtures/snapshot` + `/api/scores/snapshot/18193785` (USA v Belgium) printed authenticated (ADR-013/014/015). Mock CI = `pnpm --filter @omnipitch/txline test`; live = `packages/chain/scripts/txline-live.mjs`. |
| 06 | ingest → bus (replay) | — | requires 05 GREEN ✓ |
| 07 | settlement proof spike (validateStat CPI) | — | requires 05 GREEN ✓ (uses the txoracle IDL + stat-validation now proven) |
| 08 | — | — | requires 05 GREEN ✓ |
