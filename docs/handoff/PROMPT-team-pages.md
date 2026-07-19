# Terminal prompt — Fix 4 (Session D): team pages (48 WC26 nations + 10 clubs)

Runs in PARALLEL with A (ticker), B (search), C (player pages).
You are **Session D**. Your ADR is **ADR-083**. Read `docs/handoff/PARALLEL-PLAN.md` first —
**you share the football-data key with A and B, so your bake is scheduled, not spontaneous.**

---

```
Build /team/[code] — a Sofascore-class team page — for all 48 WC26 national teams first, then 10 major
clubs. Search results, match pages and lineups all need a real team destination. You are Session D.

STEP 0 — READ FIRST
- LOOK AT THE REFERENCE IMAGES with the Read tool: docs/handoff/refs/ref-team-header.png and
  ref-team-standings.png. Then docs/handoff/refs/README.md for the measured spec. ADR-049: reference =
  INTENT, not a pixel target. Ninety tokens ALWAYS win on colour — their violet tabs, green/red W-L pills
  and qualification-zone bars map to --chain / --up / --down / --halt. Never copy their hex.
- CLAUDE.md: two-source law (ADR-051), ADR-055 (baked local crests/flags, no runtime CDN), Design law
  (tokens only; system font for text; mono+tabular ONLY for numbers), Verification law.
- PARALLEL — you own ONLY these paths:
    NEW  apps/api/src/http/routes/teams.ts     (do NOT edit richdata.ts — Session A owns it)
    NEW  apps/web/src/app/team/[code]/page.tsx + apps/web/src/features/team/*
    NEW  apps/web/src/data/wc26/team-profiles.json
    ADR-083. Add no dependencies.
  REUSE the routes that already exist rather than duplicating: GET /rich/teams/:id (team + squad + coach)
  and GET /rich/standings/:competition are already live and verified. You only need to ADD one thing:
  team matches (football-data GET /teams/{id}/matches) in your own routes/teams.ts.

STEP 1 — ORDER OF WORK (non-negotiable)
1. All 48 WC26 national teams. These are on-story for a World Cup product and give COMPLETE tournament
   coverage — every board match links to two real team pages.
2. Only then, 10 clubs (Barcelona, Real Madrid, Man City, Liverpool, Man Utd, Arsenal, PSG, Chelsea,
   Bayern, Inter — or whatever football-data's free tier actually covers; verify before assuming).
If time runs out, 48/48 nations complete beats 58 half-done. Never ship a partially-populated team.

STEP 2 — WHAT THE DATA SUPPORTS (teams are far better covered than players)
✅ HAVE — all from football-data.org (10 req/min, generous):
  - Identity: name, shortName, tla, crest, founded, clubColors, venue, website → GET /teams/{id}
  - Coach: name + contract → same payload. Squad: full player list with position + DOB → same payload.
  - Matches (the whole left panel): GET /teams/{id}/matches → competition, date, status, score, home/away.
    Split into Finished / Upcoming; group by competition exactly like the reference.
  - Standings incl. **form (last 5)**, P W D L, GF/GA, goal difference, points →
    GET /competitions/{code}/standings. For WC26 that's competition 2000 and returns ALL group tables in
    ONE call. Qualification zones (advance / eliminated) coloured via tokens.
  - Recent form strip: derive from the same matches payload — opponent crest + W/D/L bar.
❌ DO NOT BUILD — no free source; inventing them is the fake-proofs defect class:
  - "7.8M followers"  ·  Media tab  ·  transfer values
  - Coach PHOTO: football-data gives the coach's name only. API-Football has photos but that key is
    Session C's 100/day budget — DO NOT SPEND IT. Use initials-in-a-circle with team colours.

STEP 3 — BAKE IT (SCHEDULED — you share the 10 req/min key with A and B)
  - WAIT for Session B to announce "BAKE DONE" before your first call. Then announce
    "SESSION D BAKE START" and "SESSION D BAKE DONE" so A can run its probe.
  - Budget: 58 × /teams/{id} + 58 × /teams/{id}/matches + ~6 × standings ≈ 122 calls ≈ 13 minutes at the
    ceiling. Throttle to <10/min with a hard sleep. This comfortably fits — unlike Session C, you are not
    budget-starved, you are rate-limited. Do not parallelise your own fetches.
  - Make the script RESUMABLE (persist after each call, skip cached) so a 429 doesn't restart 13 minutes.
  - Output apps/web/src/data/wc26/team-profiles.json, committed. Never fetch at runtime (ADR-051).
  - Crests: bake locally into public/crests/ alongside the existing flags (ADR-055 — no runtime CDN).
    Reuse the existing baked WC26 flags for national teams rather than refetching.

STEP 4 — THE PAGE
  - Header card: 96px crest · team name (system font, large, semibold) · flag + country · coach (initials
    avatar + name + "Coach") · then a meta strip: venue, competition, founded.
  - Right of header: "Previous match" and "Next match" cards — competition emblem, date, FT/kickoff,
    both teams + score. (For a knocked-out nation, "Next match" shows an honest empty state, not a blank.)
  - Left column: Matches panel with List/Calendar toggle, Finished/Upcoming filter, grouped by competition,
    rows = date/FT · both teams · score · W/D/L pill (--up / --text-lo / --down). Below it, Recent form.
  - Right column tabs: Standings · Statistics · Players · Details. ONLY tabs with data — no empty Media tab.
    Standings = the group/league table with P W D L DIFF GLS and a Last-5 form strip, current team row
    highlighted, qualification zones as a token-coloured left border.
  - Players tab: the squad from the same payload, grouped by position, linking to /player/[id] **only for
    players Session C actually baked** — everyone else is non-navigable (no 404s, ever).
  - All numbers mono + tabular-nums; everything else system font.

STEP 5 — THE NINETY DIFFERENTIATOR (build this — it's why our page isn't a clone)
Add a **"Market view"** panel that only an exchange can show:
  - This team's win-probability price across the tournament (their price path, match by match).
  - Their biggest price swings, sourced from our existing Moment/market-event data
    ("74' vs Morocco — CAN to win 41.0 → 61.4 (+20.4)").
  - Market vs reality: what price the market gave them before a match vs what actually happened.
This is "price is probability" told at team level, from OUR data. Copy law: price · trade · credits —
NEVER bet/stake/odds/wager.

STEP 6 — VERIFY (Verification law)
  - Do NOT run a verification server — verification is ONE merged pass on the main tree (PARALLEL-PLAN.md).
  - Have ready: 3 team pages at lg+xl — a nation still alive (full Next match), a knocked-out nation
    (empty-state Next match), and a club — plus one deliberately partial bake to prove empty states.
  - READ-OUT-LOUD every page: the standings row must agree with the matches list; P/W/D/L must sum to the
    match count; "Previous match" must equal the top Finished row; form strip must match the last 5 results.
    Any disagreement is a ship-blocker.
  - Zero 404s: every crest, every squad link, every match link resolves or is deliberately non-navigable.
  - ADR-083 records: the 58-team list and how it was chosen, calls spent, the coach-photo decision, and
    every field deliberately NOT shown (followers, values, media) and why.
```

---

## Notes for Sushant

**Teams are the easy win of this batch.** Unlike players — where ratings and market value simply aren't
purchasable on our tier — football-data.org gives you nearly the whole reference page for teams: squad,
coach, venue, founded, full match history, and standings *with last-5 form*, all in two calls per team. The
48 nations cost ~13 minutes of throttled fetching, not a rationed daily budget. This one will look the most
complete of the four.

**One scope opinion, which you should overrule if you disagree:** Barcelona and Liverpool pages don't serve
a World Cup product. They cost budget and reviewer attention while telling no part of the Ninety story, and
a judge will never search for them. The 48 nations give complete tournament coverage and make every board
match link to two real pages. The prompt therefore does all 48 first and treats the 10 clubs as a follow-on —
if the clock runs out, you lose the clubs, not the tournament.

**Session D is the one that must wait.** A, B and D all draw on the same 10 req/min football-data key.
C is free to run whenever (different key entirely). The handshake is in PARALLEL-PLAN.md: B bakes → D bakes
→ A probes.
