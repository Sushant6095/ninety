# Where data lives — the placement rule (frontend vs backend vs baked)

All four parallel sessions write data. This is the one rule they follow, so we don't end up with five
conventions. Extends ADR-051 (two-source) and ADR-055 (baked local assets).

## How Sofascore actually does it — and why we can't copy it

Sofascore/FotMob keep **everything** in a backend database and serve images from their own CDN
(`api.sofascore.app/api/v1/team/{id}/image`). The frontend is a thin client that fetches per request and
caches at the edge. Nothing is baked into their bundle.

They can do that because they hold **licensed feeds with effectively no rate limit**. We hold
**100 requests/DAY** (API-Football) and **10/minute** (football-data.org). We therefore *cannot* call a
provider on a user request — one popular page would exhaust a day's budget. So our equivalent of "their
CDN" is: **fetch once at build time, commit the result, serve it statically.** Same outcome (instant, cached,
no per-request upstream), different mechanism, forced by economics.

## The rule

Don't ask "is it static or dynamic?" — most football data is **dynamic for 90 minutes and static forever
after**. Ask instead: **who owns it, and how often does it change relative to a deploy?**

| Data | Changes | Lives | Why |
|---|---|---|---|
| Flags, crests, stadium/team metadata, the 104-fixture skeleton, groups | Never (per tournament) | **Baked in frontend** (`src/data/wc26/*.json`, `public/`) | Zero API calls, instant, survives backend downtime |
| Player + team bios, squads, coaches (the Session B/C/D bakes) | Rarely | **Baked in frontend** | Rate limits make runtime fetching impossible |
| Scores, minutes, halts, prices, live status | Every few seconds, during a match | **Backend** — TxLINE → engine → Redis → client | ADR-051: TxLINE owns what MOVES. Never bake. |
| Standings, scorers, lineups, season stats | Slowly (hours) | **Backend cached proxy** (`richProxy.ts`, Redis TTL) | Changes too often to bake, too rate-limited to call per request |
| Orders, positions, moments, leaderboard, users | Per user action | **Postgres** | It's ours, it's queryable, it's per-user |

**A finished match result** crosses tiers on purpose: TxLINE-owned while live → persisted to Postgres as
history when it ends → optionally baked for a reproducible demo. That's not inconsistency, it's the
lifecycle.

## Images — the counterintuitive part

Baking a copyrighted image into a **public** repo is a *stronger* act of redistribution than hotlinking it.
So "bake everything" is not automatically the safer choice:

- **Flags** — bake freely. Public-domain, tiny, already at `public/flags/{w80,w160}`.
- **Club/national crests** — bake only if the provider's terms allow redistribution; record the finding in
  the ADR. `public/crests/` is the home.
- **Player photos** — highest risk (personality rights **and** provider terms). Default to
  initials-in-a-circle with team colours unless terms are explicitly clear. We already learned this on the
  Iron Man clip.

## ⚠ Two live problems in the current tree

**1. `apps/web/public/teams/` is 101MB across 48 folders, and it is TRACKED IN GIT.**
That is the bulk of a 116MB `public/`. On a public repo this means slow clones for judges and permanent
weight in history (rewriting it later means rewriting history). Vercel serves it fine — the cost is the
*repository*, not the runtime. Decide before the next commit:
- Do all 48 teams need ~2–4MB of media each for the demo? Downscale/convert to WebP, or
- Keep a handful of hero teams at full weight and thin the rest, or
- Accept it deliberately and write it down.
Do NOT let it grow: Sessions C and D are adding crests and possibly player photos on top.

**2. The baked JSON must not land in the initial bundle.**
`team-profiles.json` is **856KB** and `players.json` is **285KB**. If `CommandMenu.tsx` (global, mounted
everywhere) imports the search index at module scope, every page pays 285KB of parse before FCP — on a
landing whose FCP is currently 104ms. Required:
- Load the search index **lazily when the palette first opens** (dynamic `import()`), not at module scope.
- Import `team-profiles.json` / `player-profiles.json` inside the `/team/[code]` and `/player/[id]` routes
  only, so Next code-splits them per route.
- Re-check the bundle after wiring: `pnpm --filter web build` and read the route-size table. A landing that
  grew by hundreds of KB is a regression, not a feature.
