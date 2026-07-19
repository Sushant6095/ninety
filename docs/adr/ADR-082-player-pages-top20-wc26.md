# ADR-082 — Player pages: /player/[id] for the top-20 of WC26, honest to the data tier

**Status:** Accepted · **Date:** 2026-07-18 · **Session:** C (parallel Fix-3, see `docs/handoff/PARALLEL-PLAN.md`)
· **Follows:** ADR-051 (two-source rule), ADR-055 (baked local assets, no runtime CDN), ADR-049 (reference = intent),
ADR-072/080/081 (rich-data proxy · fixtures-by-date · entity search). · **Owns:** `apps/api/src/http/routes/players.ts`,
`apps/web/src/app/player/[id]/*`, `apps/web/src/features/player/*`, `apps/web/scripts/bake-player-profiles.mjs`,
`apps/web/src/data/wc26/player-profiles.json`.

## Context
Search rows and match lineups had no destination — a Sofascore-class `/player/[id]` gives the top scorers a real page.
The reference page is ~40% panels our data tier cannot source (market value, follower counts, Sofascore's proprietary
ATT/TEC/TAC/DEF/CRE rating model, heatmaps). Faking any of them is the fabricated-Solscan-link defect class. So this
page builds ONLY what real data supports, **derives** what it honestly can (labelled), and **adds** a panel no stats
site can show (market impact), rather than padding the gaps.

## Decisions

1. **The 20 are derived by data, not curated.** `GET https://api.football-data.org/v4/competitions/2000/scorers?limit=30`
   (FIFA World Cup 2026, season 2026-06-11..2026-07-19), ranked by **goals+assists** (tie-break goals), take the top 20.
   Reproducible list as baked 2026-07-18:
   Messi(ARG) · Mbappé(FRA) · Haaland(NOR) · Kane(ENG) · Bellingham(ENG) · Dembélé(FRA) · Oyarzabal(ESP) · Quiñones(MEX) ·
   Vinicius Jr(BRA) · Sarr(SEN) · Undav(GER) · Manzambi(SUI) · Gakpo(NED) · Lukaku(BEL) · Lautaro(ARG) · De Ketelaere(BEL) ·
   Embolo(SUI) · Summerville(NED) · Jiménez(MEX) · Balogun(USA). Route id = football-data **person id** (same id as
   `wc26/players.json`, so search rows resolve).

2. **football-data is the ONLY live source; API-Football is unusable for WC26.** Probed and confirmed:
   API-Football's **free plan is season-restricted** — `{"plan":"Free plans do not have access to this season, try from
   2022 to 2024."}` for `league=1&season=2026`. Its per-match ratings, season aggregates and injuries are therefore
   **unreachable for the 2026 World Cup**, and filling those panels with a player's 2022–2024 CLUB stats would be the
   wrong-tournament fabrication. So they are **omitted, never faked.** Identity + tournament production come from
   `/scorers` + baked `players.json`; the per-match log from `GET /persons/{id}/matches?competitions=2000` (free-tier
   accessible: real date · stage · both teams · full-time score → we derive W/L/D from the player's side).

3. **Photos: baked-local when present, else initials avatar (STEP 6 = option b as the floor).** 7/20 already have a baked
   photo in `public/teams/{id}/players/*.jpg` (Session B, TheSportsDB). We reuse those (ADR-055: no runtime CDN) and give
   the other 13 a clean initials disc in a token surface with a nation-crest badge. We do **not** fetch/redistribute
   API-Football's media (terms unclear → the Iron-Man-clip lesson: when unclear, don't).

4. **Ninety index — a DERIVED radar, honestly labelled.** Five axes from real WC26 per-match production (Scoring = goals÷matches,
   Creation = assists÷matches, Involvement = (g+a)÷matches, Open play = non-penalty goals÷matches, Presence = matches),
   normalised across the 20. Rendered in `--up` on a `--hairline` grid, labelled *"Derived from WC26 per-match production,
   normalised across the top 20. Not an official rating,"* with each axis's formula on hover. Never presented as authoritative.

5. **Market impact — the differentiator, kept honest at TEAM level.** For the player's nation, the biggest modeled price
   swings from our OWN `lib/moments` (e.g. Vinicius/BRA → *"30' Brazil pull clear · BRA 71.0 → 84.0 · +13.0%"*). Labelled
   *"Team-level modeled moments — not attributed to a single goal,"* because our modeled Moments are team/demo pairings and
   claiming a specific player scored one would be fabrication. Nations with no modeled market show the honest empty state
   ("No market-moving moments modeled for {nation} yet") — proven live on Messi/ARG. Copy stays play-money (price · trade ·
   credits); the `law-guard` hook enforces it.

6. **`GET /players` + `/players/:id` read-model, wired the CONNECT way.** A thin Fastify route re-serving the baked file;
   it never calls a provider and degrades to **503 {needs}** if the bake is absent — same honest-degrade contract as the
   rich-data proxy. Test: `players.test.ts` (20 rows / id resolve / 404 / 503). Frontend consumer (per the no-dead-code
   gate + ADR-072/073 fixture-switch): `lib/api.ts` typed clients (`getPlayerProfiles`/`getPlayerProfile`) → a loader
   module PINNED to the baked fixtures by default (STILL data → SSG-friendly), with the live paths kept as the un-pin
   target — exactly `lib/data/moments.ts`. The page renders through the loader and a **"More top scorers" rail** consumes
   the index (cross-navigation across the 20 so a player page is never a dead-end).

## API budget spent
- **football-data:** 21 calls in the bake (1 `/scorers` + 20 `/persons/{id}/matches`), throttled ~8/min under the 10/min
  ceiling; resumable cache in `apps/web/scripts/.cache/player-profiles/` (a 429/crash/timeout re-spends nothing). Plus a
  handful of exploratory probes (`/scorers` sizing, one `/persons` shape check).
- **API-Football:** **0 data calls.** 1 free `/status` (quota 1/100 at start) + 2 probes that returned the season-restriction
  error above. The 100/day budget the plan reserved for C was intentionally **not** spent — there was nothing to buy for 2026.

## Fields we deliberately DO NOT show (and why)
- **Market value / followers** — no free source; inventing them is the fake-proofs class.
- **Official ATT/TEC/TAC/DEF/CRE rating radar · heatmaps · Media/Fantasy tabs** — Sofascore-proprietary / unsourceable. The
  Ninety index replaces the radar honestly; an empty tab a judge clicks is worse than an absent one → only Matches + Season.
- **Per-match ratings · minutes · per-match player events · season/injury aggregates** — API-Football, plan-blocked for 2026.
- **Height · preferred foot** — not in the football-data scorer/person payloads on our tier.
- **Current club · contract-until** — WC is a national-team tournament; the free tier ties a player to their NATION, not a
  verified current club, so we show the nation and omit club/contract rather than guess.

## Verification
Local production build (`pnpm --filter web build`) — `/player/[id]` prerenders as SSG for all 20 ids (674 B / 112 kB first
load). READ-OUT-LOUD run against the prerendered HTML on 3 pages (Messi · Vinicius · Haaland): age↔DOB correct (Haaland 25,
pre-birthday; Messi 39), per-match rates correct (8/7=1.14, 4/5=0.80), previous-match card == table top row on every page,
and cross-page integrity holds (BRA 1–2 NOR shows **L** on Vinicius and **W** on Haaland — the same real match). Full
lg+xl screenshot look is deferred to the single merged verification pass (PARALLEL-PLAN §Verification), not a per-session
server.
