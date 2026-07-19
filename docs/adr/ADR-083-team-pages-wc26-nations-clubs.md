# ADR-083 — Team pages: /team/[code] for the 48 WC26 nations + 10 clubs, honest to the data tier

**Status:** Accepted · **Date:** 2026-07-18 · **Session:** D (parallel, see `docs/handoff/PARALLEL-PLAN.md`)
· **Follows:** ADR-051 (two-source rule), ADR-055 (baked local assets, no runtime CDN), ADR-049 (reference = intent),
ADR-072/080/081/082 (rich-data proxy · fixtures-by-date · entity search · player pages). · **Owns:**
`apps/api/src/http/routes/teams.ts`, `apps/web/src/app/team/[code]/*`, `apps/web/src/features/team/*`,
`apps/web/scripts/bake-team-profiles.mjs`, `apps/web/src/data/wc26/team-profiles.json`, `apps/web/public/crests/*`.

## Context
Search results, match pages and lineups all pointed at a team destination that did not exist. A Sofascore-class
`/team/[code]` gives every board match two real team pages. Teams are **far better covered** by the free data tier
than players are (whole squads, staff, tables, full match lists), so this page can be richer than the player page
without inventing anything. The reference still shows ~30% panels we cannot source (follower counts, squad market
value, a Media tab); faking any of them is the fabricated-Solscan-link defect class, so they are **absent, not faked.**

## Decisions

1. **58 teams, chosen by the story — nations first, then the biggest clubs the free tier actually covers.**
   - **48 nations = the entire WC26 field** (`data/wc26/teams.json`, the baked two-source skeleton). Route key = FIFA
     tla (`/team/BRA`), so every board/search/match link resolves. This is complete tournament coverage — the
     non-negotiable STEP-1 priority.
   - **10 clubs = the marquee names, each verified live** (route = slug): Barcelona(81), Real Madrid(86), Man City(65),
     Liverpool(64), Man Utd(66), Arsenal(57), PSG(524), Chelsea(61), Bayern(5), Inter(108). The bake self-verifies —
     a club id off the free tier is logged and skipped, never faked. All 10 resolved.

2. **The page reads only what real data supports; the differentiator is ours.** Header (crest · name · flag+country ·
   coach · venue/competition/founded), Previous/Next cards, a Matches panel (List/Calendar · Finished/Upcoming ·
   grouped by competition · W/D/L pills), Recent form, and tabs mounted **only when they have data** (Standings ·
   Statistics · Players · Details — no empty Media tab a judge can click). The **Market view** is the panel no stats
   site can show: this team's win-price moves from our own modeled Moments, plus **market-vs-reality** — the price the
   market gave, joined by opponent code to the team's real full-time result.
   - **Layout (beats the reference, ADR-049):** the reference puts the tabs in a right rail. A data-dense standings
     table (up to 20 rows × 8 cols) **clips in a ~430px rail** with PTS scrolled off — objectively worse. So the body
     is two columns (Matches · Market-view + Recent-form) and the **tabs render full-width below**, where the table
     shows every column and the squad/stat grids get room. Verified at lg+xl on a live prod build.
   - **Two tab guards for honesty:** Standings mounts only when the table has **games played** — a not-yet-started
     league returns an all-zero table (every club 0 pts, rank 1), honest but a wall of zeros, so it's hidden.
     Statistics mounts only with finished matches; Players only with a non-empty squad.

3. **Cost: competition-level calls, not per-team — reality is far cheaper than the 122-call budget.** The
   `/competitions/2000/{teams,matches,standings}` payloads each return ALL 48 nations at once (identity, every WC
   match, all 12 group tables) → **3 calls for every nation.** Clubs: `/teams/{id}` + `/teams/{id}/matches` (2 each)
   + one `/competitions/{league}/standings` per distinct league (PD·PL·FL1·BL1·SA, deduped = 5). **Total ≈ 28
   football-data calls + 10 crest downloads**, throttled 6.5s (<10/min), resumable cache (a 429 resumes, never
   restarts). Squads + coaches are **not refetched** — they are JOINED from the already-baked `players.json` /
   `coaches.json` (ADR-081).

4. **Coach photo: reuse the baked face when we have it, else an initials disc — zero API-Football spend.** football-data
   gives the coach name only. Some nations already have a baked-local coach face (`coaches.json`, Session B/TheSportsDB)
   — we reuse those (ADR-055). The rest get a clean initials disc on a **token** surface (the Design law forbids raw
   team hex, so the prompt's "team colours" avatar is a token surface, not a parsed club colour). We did **not** spend
   API-Football's 100/day budget (Session C's) for photos.

5. **Crests: nations reuse the baked flags; clubs bake locally (ADR-055 — no runtime CDN).** Nations render via
   `TeamCrest(fifaCode)` → the baked flag disc. Clubs have no FIFA code, so each crest is downloaded once into
   `public/crests/{fdId}.{ext}` and rendered with `next/image unoptimized`. The bake also **strips every CDN url**
   (match-side crests, competition emblems, standings-row crests) from the JSON so nothing tempts a runtime fetch —
   the baked file has **zero** `crests.football-data.org`/`flagcdn` asset urls.

6. **Bundle safety.** `team-profiles.json` is 836 KB. It is imported **only** by the server-only `loaders.ts`; the
   client components (MatchesPanel, tabs) import only the pure `data.ts` helpers, so the dataset never enters a client
   bundle (the `players.json` lesson from `data/wc26/index.ts`). Each page ships only its own team's slice.

## What is deliberately NOT shown (and why)
- **Follower counts / social reach** — no free source. Inventing a number is fabrication.
- **Squad market value / transfer values** — no free source; wrong-number fabrication.
- **A Media tab** — we have no owned media set for teams; an empty tab is a judge trap.
- **Per-match ratings / xG / possession / shots** — API-Football's free plan is season-blocked for 2026 (ADR-082),
  so these are unreachable for the tournament and are omitted, never back-filled with club data.
- **Per-opponent Last-5 in the standings table** — the free tier returns no `form` field, so only the current team's
  row shows a real derived Last-5; other rows show none rather than an invented strip.
- **Club squads for Barcelona/Real Madrid/PSG/Bayern/Inter** — the free tier returned an empty squad for these five;
  their Players tab is simply not mounted (honest), while Man City/Liverpool/Man Utd/Arsenal/Chelsea show real squads.
- **Club season-split is a known free-tier artifact.** `/teams/{id}/matches` returns the club's **upcoming** season
  fixtures (all scheduled → empty Previous-match, no Statistics tab), while `/competitions/{league}/standings` returns
  whichever season the tier calls "current" — the **completed** table for La Liga (real numbers) but the **not-started**
  table for the Premier League (all zeros → Standings hidden by the guard above). Both halves are real and labelled;
  neither is faked. This affects only clubs (secondary) — the 48 nations are one tournament, fully self-consistent.

## Consequences
- Every board match now links to two real, fully-populated team pages; the board/search/match graph has no dead ends.
- Player links from a squad resolve **only** for players with a baked profile (the top-20/86); the rest are shown but
  non-navigable — no 404s, ever.
- `GET /rich/teams/:id/matches` (routes/teams.ts) completes the rich-data API surface and is the CONNECT un-pin target;
  the page itself is pure SSG from the baked JSON (never calls it at runtime).
- Re-bake with `node apps/web/scripts/bake-team-profiles.mjs` (resumable). Verification is the single merged pass on
  the main tree (PARALLEL-PLAN.md), not a per-session server.
