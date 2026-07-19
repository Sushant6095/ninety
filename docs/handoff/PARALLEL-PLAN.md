# Running Fix 1 (ticker) + Fix 2 (search) in parallel

They touch almost no common code — but they share two invisible resources that WILL collide.
Read this before launching both sessions.

## The two real collisions

**1. The football-data.org rate limit is per-KEY, not per-process.** 10 requests/minute, shared.
Fix 2's bake pass makes 48 sequential team calls over ~5 minutes at the ceiling. If Fix 1 is probing
`/competitions/2000/matches` at the same moment, they 429 each other and both will "discover" that the
endpoint doesn't work. It does — they just starved each other.
→ **Rule: Session B runs the 48-team bake FIRST and ALONE.** Session A does its verification curl before
B starts, or after B's bake finishes. Never during. B announces "bake done" before A resumes API probing.

**2. ADR numbers.** Both sessions will reach for "the next ADR" and both will pick 080.
→ **Pre-assigned, non-negotiable: Fix 1 = `ADR-080-live-ticker-fixtures-by-date.md` ·
Fix 2 = `ADR-081-entity-search-baked-index.md`.** Neither session picks its own number.

## File ownership (no overlap — do not cross these lines)

| Area | Session A — Ticker | Session B — Search | Session C — Player pages | Session D — Team pages |
|---|---|---|---|---|
| API route | `http/routes/richdata.ts` (add fixtures-by-date) | `http/routes/search.ts` (extend) | **NEW** `http/routes/players.ts` | **NEW** `http/routes/teams.ts` |
| Web component | `features/board/Ticker.tsx` + its mounts | `components/ui/CommandMenu.tsx` | **NEW** `app/player/[id]/` + `features/player/*` | **NEW** `app/team/[code]/` + `features/team/*` |
| Baked data | reads `wc26/games.json` (read-only) | **writes** `wc26/players.json`, `coaches.json`, `referees.json` | **writes** `wc26/player-profiles.json` | **writes** `wc26/team-profiles.json` + `public/crests/` |
| Bake script | — | extends the `wc26:refresh` pass | own resumable bake script | own resumable bake script |
| Third-party key | football-data (~2 calls) | **football-data** (48 calls) | **API-Football** (~75 of 100/day) | **football-data** (~122 calls) |
| ADR | ADR-080 | ADR-081 | ADR-082 | ADR-083 |

### football-data key: THREE sessions share 10 req/min — bake in this order

`B (48 calls, ~6 min)` → announces **BAKE DONE** → `D (122 calls, ~13 min)` → announces
**SESSION D BAKE DONE** → `A (~2 probe calls, seconds)`.

A may instead take its 2 probe calls *before* B starts. Nobody parallelises their own fetches; everyone
throttles below 10/min and writes a resumable cache. **Session C ignores this queue entirely** — it spends
the API-Football key, which is a different budget, so C runs from the start alongside everyone.

C's risk is the opposite of D's: C is *budget*-starved (100/day, one shot), D is merely *rate*-limited
(122 calls is fine, it just takes 13 throttled minutes).

**C overlaps freely with B** — they spend *different* API keys (C = API-Football, B = football-data).
The football-data contention rule (below) is between **A and B only**. C's own risk is its 100/day
API-Football ceiling: its bake must be resumable, deduped and budget-logged, because there is no second try
until tomorrow.

**Cross-session dependency:** search rows (B) and lineup names may only start linking to `/player/[id]`
**after C lands**. Until then they stay non-navigable per Fix 2's honesty gate — no 404s.

Neither session adds a dependency. If either thinks it needs one, stop and ask — that's a shared
`package.json` / `pnpm-lock.yaml` edit and an instant conflict.

## Shared files — append-only, one section each

`design/PROVENANCE.md` and `NOW.md` are the classic parallel merge conflict. Each session appends its rows
under its OWN clearly-labelled heading (`## Ticker (ADR-080)` / `## Entity search (ADR-081)`), never
interleaved, never reformatting existing rows. Verdicts go to distinct filenames in `design/verdicts/`.

## Verification — this is where parallel STOPS

CLAUDE.md is explicit: verify on a local production build, **not `next dev`, not a worktree.** So the two
sessions may BUILD in parallel, but they cannot each claim the verification pass:

1. Both sessions finish their work and report.
2. Merge both into `merge/live-integration`.
3. **ONE verification pass on the main tree** covering both surfaces:
   `pnpm --filter web build && pnpm --filter web start` (:3000, once) → screenshot the ticker AND the open
   palette at lg+xl → read-out-loud both → click-through test for zero 404s → design-cop verdicts.
4. Only then is either feature "done". A worktree-green build is not proof.

If you'd rather not merge first: serialize just the verification — A verifies on :3000, then stops the
server, then B verifies on :3000. Never two `next start` on the same port.

## Launch order (copy-paste)

```
Session B (start FIRST — it owns the API budget for the first ~5 minutes):
  Read docs/handoff/PROMPT-search-entities.md and execute it. You are Session B.
  Your ADR is ADR-081. You own search.ts, CommandMenu.tsx, and the wc26 squad bake.
  Run the 48-team football-data bake FIRST, then announce "BAKE DONE" before doing anything else.
  Do not touch Ticker.tsx or richdata.ts. Do not run a verification server — verification is a
  single merged pass on the main tree, per docs/handoff/PARALLEL-PLAN.md.

Session A (start after B announces BAKE DONE, or do the curl check before B begins):
  Read docs/handoff/PROMPT-live-ticker.md and execute it. You are Session A.
  Your ADR is ADR-080. You own richdata.ts and Ticker.tsx.
  Do not touch search.ts or CommandMenu.tsx. Do not add deps. Do not run a verification
  server — verification is a single merged pass on the main tree, per docs/handoff/PARALLEL-PLAN.md.
```

## Honest note on whether parallel is worth it

Coordination overhead is real: two sessions, a serialized bake, a pre-assigned ADR split, and a merged
verify. For two features this size that's still a net win — Fix 2's 5-minute bake is dead time Fix 1 can
use. But if anything goes sideways, collapse to sequential (B then A) rather than debugging a race.
