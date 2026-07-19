# Terminal prompt — Fix 2: advanced entity search (Sofascore-class), then entity pages

Fix 1 (the ticker prompt) stands unchanged. This is Fix 2. Phase A = the search bar. Phase B = the detail
pages, outlined at the bottom but NOT in this prompt — read the "honesty gate" note before you run Phase A,
because it decides which categories are allowed to ship.

---

```
Upgrade the ⌘K command palette (apps/web/src/components/ui/CommandMenu.tsx) into a full entity search with
category tabs — Team · Player · Match · Competition · Manager · Venue — with Recent + Suggested sections and
rich rows (crest/flag/photo, name, meta line). Reference: Sofascore's search.

STEP 0 — READ FIRST
- ALSO READ docs/handoff/PROMPT-search-spotlight-amendment.md — we are adopting the 21st.dev
  `apple-spotlight` component as the MOTION SHELL for this palette (zero installs needed; everything is
  already in package.json). It carries a re-skin table, a hard decision on its `url(#blob)` gooey filter,
  and the keyboard/a11y additions it lacks. Keep THIS file's information architecture; take only its motion.
- LOOK AT THE REFERENCE IMAGES with the Read tool (you can read images — do not skip this and work from
  prose): docs/handoff/refs/ref-search-all.png · ref-search-manager.png · ref-search-match.png, and OUR
  current state in ref-ours-palette.png. Then read docs/handoff/refs/README.md for the measured spec
  (row heights, avatar sizes, pill padding, the two-line row anatomy) and the delta between ours and theirs.
  ADR-049 governs: the reference is INTENT, not a pixel target. Match structure, rhythm and hierarchy —
  never copy their hex. Ninety tokens always win on colour.
- CLAUDE.md: Two-source law (ADR-051 — TxLINE owns what MOVES; baked worldcup26 owns what SITS STILL),
  ADR-055 (flags/crests are baked local assets, NEVER a runtime CDN), Design law (tokens only; system font
  for text, mono+tabular ONLY for numbers), Verification law.
- Existing pieces to EXTEND, not replace: apps/api/src/http/routes/search.ts (matches + team names from
  Postgres) and apps/web/src/components/ui/CommandMenu.tsx (already renders matches with crests + minutes).
- Invoke the ui-craft router first. New architectural call → write an ADR before coding.

STEP 1 — THE HARD CONSTRAINT THAT DICTATES THE ARCHITECTURE
API-Football free tier = 100 requests per DAY. Football-Data.org = 10 per MINUTE. A search-as-you-type that
calls either per keystroke is impossible — it would burn the entire daily budget in ~100 keystrokes.
Therefore: BAKE THE INDEX ONCE, SEARCH IT LOCALLY. Zero third-party calls per keystroke, ever.

STEP 2 — bake the entity index (one-time script, output committed)
Extend the existing static-data bake (`pnpm --filter web wc26:refresh`) with a squads/staff pass:
  - For each of the 48 WC26 teams: football-data.org GET /teams/{id} → returns `squad` (players: id, name,
    position, dateOfBirth, nationality) AND `coach`. Throttle to <10 req/min (48 teams ≈ 5 minutes, once).
  - GET /competitions/2000/matches → the payload carries a `referees` array per match; derive the referee list.
  - Write: apps/web/src/data/wc26/players.json · coaches.json · referees.json (venues already exist in
    stadiums.json; teams in teams.json; fixtures in games.json).
  - This is STILL data → baked is correct per ADR-051. Never fetch it at runtime.
  - Record real counts in the ADR (how many players/coaches/referees actually came back).

STEP 3 — search execution (hybrid, no third-party at query time)
  - Entities (team · player · manager · venue · competition): client-side fuzzy match over the baked JSON.
    Instant, offline-capable, zero network. Rank: exact prefix > word-start > substring; tie-break by
    entity importance (WC26 teams above players).
  - Matches + traders + moments: the existing GET /search API (Postgres-backed) so live status is real.
  - Debounce 120ms, abortable, min 2 chars (the API already enforces MIN_Q=2).

STEP 4 — the UI
  - Category tabs as pills across the top (All + the enabled entity types), horizontally scrollable, the
    active pill filled. Tab/arrow keys move between them.
  - Sections: "Recent" (persisted to localStorage, with Clear history) then "Suggested" when the query is
    empty; grouped results when it isn't.
  - Row anatomy: 28px crest/flag/photo (baked local asset, ADR-055) · name in system font semibold ·
    meta line in --text-lo (country · competition / team) · right-side affordance (minute in --up for a
    live match, kickoff time, or a star to favourite).
  - Numbers (minute, score, kickoff, counts) mono + tabular-nums. Everything else system font. Tokens only.
  - Keyboard: ⌘K opens, ↑/↓ move, ↵ opens, esc closes, ⌘1..9 jump to a category. Full a11y:
    role="combobox" + listbox, aria-activedescendant, visible focus ring, 44px hit targets.
  - States: skeleton rows while querying, an honest empty state ("No matches for X"), and an error state.
    NEVER fabricate a result.

STEP 5 — THE HONESTY GATE (this is a ship-blocker, not a preference)
Every row that LOOKS clickable must go somewhere real. Detail pages are Phase B and do not exist yet.
So in Phase A:
  - Enable a category ONLY if its destination exists (Match → /match/[id] exists; Team → /competition or a
    filtered board view if that's all we have).
  - For Player / Manager / Venue with no page yet: render them NON-navigable (no pointer cursor, no href) or
    expand an inline detail popover with the baked facts we hold. A row that routes to a 404 is the same
    defect class as the fake Solscan links the audit called out.
  - DROP the "News" and "Referee" tabs unless Step 2 actually yields data. An empty tab a judge clicks is
    worse than an absent one.

STEP 6 — VERIFY (Verification law)
  - pnpm --filter web build && pnpm --filter web start (:3000). Not dev.
  - Screenshot the palette at lg+xl: empty state, a query with hits, and a query with NO hits.
  - READ-OUT-LOUD every row: name, meta line and right-side value must agree with the baked source.
  - Click-through test: every navigable row lands on a real page — zero 404s. Tab through with the keyboard.
  - axe pass on the open palette. design-cop verdict → design/verdicts/. PROVENANCE row. Write the ADR.
```

---

## Phase B — entity pages (next, not in the prompt above)

Build only after Phase A ships, and build them in this order, because it's the order of how much real data
we hold:

1. **`/team/[code]`** — richest: baked crest, squad, group, fixtures, standings (`/rich/standings/2000`),
   scorers, plus our own market history for that team.
2. **`/match/[id]`** — already exists (the Terminal); add the depth tabs (Lineups · Stats · H2H · Events)
   using `/rich/lineups` and `/rich/matches/:id/h2h`.
3. **`/player/[id]`** — baked bio + `/rich/players/:id` (API-Football, 100/day → cache hard, 6h+).
4. **`/venue/[id]`** and **`/competition`** — thin but honest; stadiums.json + groups.json.

Each page needs an ADR row for its data sources and an honest empty state for fields we don't hold.

## One scheduling flag (not a refusal)

This is a multi-day feature. As of 2026-07-18 the final is tomorrow, **the demo video still isn't filmed**,
and **118 files are uncommitted**. Search + entity pages will not change a judge's mind more than a working
video will — your own 07-14 audit ranked the video as effectively *being* the submission in a consumer track.
Suggested order: commit → film → then build this. Your call, but make it deliberately.
