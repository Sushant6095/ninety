# ADR-072 — P1 backend build-out: 1X2 synthesis, missing routes, rich-data proxy, dead-code gate

**Status:** Accepted · **Date:** 2026-07-17 · **Follows:** ADR-071 (orders intake + outcome synthesis intent),
ADR-051 (two-source rule), ADR-022 (cortex pricing), ADR-036/037 (settlement fail-closed).

## Context
After ADR-071 the trade path (`POST /orders`) existed but the rest of the API surface was stubs or absent, the
frontend rendered entirely from baked fixtures (0 live calls), and the "synthesize 1X2 from the 2-outcome feed"
decision was recorded but not implemented. This ADR is the P1 construction pass.

## Decisions

1. **1X2 synthesis is real (revives the ADR-022 deferral).** The free TxLINE feed carries only Over/Under totals +
   Asian-handicap books, never a 1X2 book. `cortex/synth.py` infers scoring intensities — Poisson-CDF-inverts the
   O/U de-vigged `P(under)` to a total-goals intensity `Λ`, Skellam-inverts the AH de-vigged `P(home covers)` to
   supremacy `S`, then `cortex/dixon_coles.py` (a real Dixon-Coles bivariate-Poisson score grid, `ρ=-0.10`) maps
   `(λ_home, λ_away)` → H/D/A. `cortex/synth_marks.py` aggregates the latest O/U + AH per fixture and publishes a
   synthesized 1X2 mark under `matchId`. **Invariant:** a degenerate/missing/rail-pinned book returns `None` → the
   mark stays unpriced (`mark: null`), NEVER a fabricated 33/33/33 book. 18 property/round-trip tests pass.
   `dixon_coles.model_probs` (the 0.2 particle-filter alpha term) stays deferred — reviving the outcome-space
   synthesis does not turn on the model term.
   - *Classifier caveat:* the exact `superOddsType`/`marketParameters` strings that mark a tick as O/U vs AH are
     runtime (ADR-015). `classify_tick` is provisional — confirm against a live tick before production trust. The
     synthesis math does not depend on it.

2. **Five route surfaces built** (Fastify, matching the ADR-071 route patterns, single-writer untouched):
   `moments` (was `export {}`), `games/picks` (the Next-Goal game), `matches/:id/events|actions`, `search`,
   `rich/*`. All registered in `server.ts`.

3. **`events-read` read model.** Match events/actions were WS-pub/sub-only, so a mid-match page had no timeline.
   Added `services/events-read.ts` — a bus consumer (mirroring `markets-read`) that persists a capped, newest-first
   Redis log per match; the REST route serves the snapshot, WS streams the delta. Redis is a derived mirror only
   (two-source law).

4. **Prisma migration** (`add_pick_and_moment_fields`, non-destructive): new `Pick` model (Next-Goal picks;
   play-money — no stake, resolved by the real goal in a worker); `Moment` gains `createdAt` + `swing` + a `market`
   relation (it was unordered and unjoinable). Run `prisma migrate dev` on the Mac to generate/apply.

5. **Rich-data = cost-aware cached proxy** (`services/richProxy.ts`). Two free providers, STILL data only:
   **Football-Data.org first** (10/min, generous) for standings/scorers/teams/H2H; **API-Football** (100/DAY,
   scarce) ONLY for the gaps it alone has — lineups/formations, player stats, injuries. Redis-TTL cached (one
   upstream call serves every user of a match); per-source fixed-window budget guard with a safety margin; a missing
   key → `503 needs:<ENV_VAR>`, budget spent → `429`, upstream error → `502`. **Never fabricates.** Keys are
   env-only (`FOOTBALL_DATA_TOKEN`, `API_FOOTBALL_KEY`) — never committed (`.env*` is gitignored).

6. **`no-dead-code` Stop hook** (`.claude/hooks/no-dead-code.sh`, chained after `stop-gate.sh`): blocks a stop while
   (a) a registered endpoint has 0 frontend callers [allowlist: admin/webhooks/auth — server-to-server by design],
   (b) `lib/api.ts`/`lib/ws.ts` have 0 importers, or (c) a route file is a bare `export {}`. Prefix-heuristic on FE
   callers, declared in the header. Proven: it fired on the real dead state and narrowed to exactly the CONNECT swap.

7. **Live API client** (`apps/web/src/lib/api.ts`): one typed function per endpoint + `USE_FIXTURES` flag +
   re-exported resume-capable `wsConnect`. The CONNECT swap (point 30 FE surfaces at it, production-build verify)
   is the remaining frontend step — deliberately NOT claimed done without a build+screenshot (Verification law).

## Consequences
- The synthesis is the crown jewel and is genuinely verified (18 tests + eyeballed sane 1X2 boards).
- The API is complete and consistent; the only dead-code the gate still flags is `lib/api.ts` pending the swap.
- Live-verification of the routes (curl against a booted stack) + the FE swap happen on the Mac — see
  `docs/DEPLOY-HANDOFF.md`.
