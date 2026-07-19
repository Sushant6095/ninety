# ADR-080 — football-data.org as the FIXTURE-SCHEDULE + FINAL-RESULTS source (still data, ticker)

**Status:** Accepted · **Date:** 2026-07-18 · **Follows:** ADR-051 (two-source rule), ADR-072 (rich-data
cost-aware proxy), ADR-055 (baked local flags, no runtime flag CDN), ADR-077 (Apple font / tokens).
**Scope:** `apps/api/src/http/routes/richdata.ts` (one new route), `apps/web` broadcast ticker
(`features/home/Ticker.tsx` + `lib/broadcastFixtures.ts`). No engine, no on-chain path, no live match state.

## Context
The top ticker read from the baked `TICKER` (a demo fixture slice) and rendered every cell in mono at equal
weight — a "terminal dump", not a broadcast strap. To read like a real strap it needs a real schedule:
yesterday's results, anything live now, tomorrow's fixtures — each a chip with kickoff time, both team names,
both flags, and score/minute when relevant.

That schedule is **still data** (it does not move *during* a match): kickoff times, the fixture list, team
identities, and the **final** score of a match that has already finished. Under the two-source rule (ADR-051)
still data may come from an external provider; only what MOVES during a match — the in-play minute, the live
score, halts, marks/prices, who advances — is TxLINE-owned and must never come from a second live source.

football-data.org already backs the rich-data proxy (ADR-072) for standings/squads/scorers/H2H. Its
`/competitions/{id}/matches?dateFrom=&dateTo=` returns exactly the fixture schedule + results we need. Verified
on the free tier for competition **2000 (FIFA World Cup)** on 2026-07-18: real, coherent data — England 1–2
Argentina (semi-final, FINISHED), France v England (third place, TIMED, today), Spain v Argentina (final, TIMED,
tomorrow).

## Decision
1. **Add one route**, same shape/error contract as every other `/rich/*` route:
   `GET /rich/fixtures/:competition?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD`
   → football-data `/competitions/{competition}/matches?dateFrom=&dateTo=`.
   - **Cache TTL 60s when the window includes today** (results/statuses move that day), **600s otherwise.**
   - The client requests the **whole 3-day-ish window in ONE call** (free tier is 10 req/**minute**); the Redis
     cache key is that one path, and the client slices yesterday/live/tomorrow **client-side**. Never fan out
     per-day calls.
   - Honest degradation is inherited unchanged: `503 {needs}` when unkeyed, `429` when the per-source budget is
     spent, `502` upstream — **never fabricated data.**

2. **Field ownership (who wins per field):**
   | Field | Source |
   |---|---|
   | Fixture exists / kickoff time / stage / round | football-data (schedule) — fallback: baked `worldcup26` skeleton |
   | Team identity (name) | football-data name; **flag** from baked local PNG via FIFA-code → `lib/flags.ts` (ADR-055) |
   | **Final** score of a `FINISHED` match | football-data `score.fullTime` (settled result = still) |
   | **Live** in-play minute / score / halt / **price** of an `IN_PLAY`/`PAUSED` match | **TxLINE** — never football-data |

3. **The live segment never reads football-data's live numbers.** Today ingest is replay-only, so the ticker's
   LIVE chips read minute/score/price from the replay/fixture store (`useMatchLive`, keyed `wc26-{home}-{away}`),
   exactly as every other live surface does. football-data's own `IN_PLAY` minute/score is **ignored** — one row
   never mixes two live sources. When live devnet ingest is on, the same store is TxLINE-fed; the ticker code is
   unchanged. Right now (no real match in play) the LIVE segment is honestly **empty**, and that is correct.

4. **Sparsity is the design constraint, not a bug.** On 2026-07-18 a yesterday/live/tomorrow window is ~2–4
   matches. The bar is designed to look intentional at 2 chips (centered, not stretched) and the results window is
   widened to the last 3 days so the strip is never a lone chip. Empty/loading render skeletons + an honest empty
   state — never invented matches.

## Consequences
- One provider call serves every viewer for the cache window; 10/min is ample.
- If football-data ever drops WC coverage on the free tier, the ticker falls back to the baked `worldcup26`
  fixture skeleton for schedule and to TxLINE/replay for any live/settled score — no fabrication, honest empty.
- The TxLINE↔provider fixture-id mapping stays a separate concern (ADR-072 note). The ticker maps by
  team FIFA code (`tla`), which is sufficient for the national-team tournament; a full id map is future work.
