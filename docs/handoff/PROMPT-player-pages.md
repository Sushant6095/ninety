# Terminal prompt — Fix 3 (Session C): player pages for the top 20 of WC26

Runs in PARALLEL with Fix 1 (ticker, Session A) and Fix 2 (search, Session B).
You are **Session C**. Your ADR is **ADR-082**. Read `docs/handoff/PARALLEL-PLAN.md` first.

---

```
Build /player/[id] — a Sofascore-class player page — for the top 20 players of WC26, so search results and
match lineups have a real destination. You are Session C in a 3-way parallel run.

STEP 0 — READ FIRST
- LOOK AT THE REFERENCE IMAGES with the Read tool: docs/handoff/refs/ref-player-header.png and
  ref-player-attributes.png. Then docs/handoff/refs/README.md for the measured spec (fonts, spacing, row
  rhythm). ADR-049 governs: reference = INTENT, not a pixel target. Ninety tokens ALWAYS win on colour —
  their violet/green/amber rating chips become --chain/--up/--halt. Never copy their hex.
- CLAUDE.md: two-source law (ADR-051), ADR-055 (baked local assets, no runtime CDN), Design law
  (tokens only; system font for text; mono+tabular ONLY for numbers), Verification law.
- PARALLEL: you own ONLY these paths. Do not touch any other session's files.
    NEW  apps/api/src/http/routes/players.ts   (do NOT edit richdata.ts — Session A owns it)
    NEW  apps/web/src/app/player/[id]/page.tsx + apps/web/src/features/player/*
    NEW  apps/web/src/data/wc26/player-profiles.json  (Session B owns players.json — different file)
    ADR-082. Add no dependencies.

STEP 1 — PICK THE 20 BY DATA, NOT BY OPINION
Do not hand-curate a "top 20". Derive it: GET /rich/scorers/2000?limit=30 (football-data, already live and
verified — returns Mbappé, Messi, Haaland, Kane, Bellingham, Oyarzabal, Dembélé, Quiñones, Vinicius, Sarr…
with goals/assists/playedMatches). Rank by goals+assists, take 20, record the exact query + date in ADR-082
so the list is reproducible and defensible. A judge asking "why these 20?" gets a real answer.

STEP 2 — WHAT THE DATA ACTUALLY SUPPORTS (build only these; the rest are BANNED as fabrication)
✅ HAVE:
  - Identity: name, nationality(+baked flag), DOB→age, position, height, shirt number, current club,
    contract-until  → football-data GET /persons/{id} (+ API-Football /players for height/photo).
  - Season aggregates: appearances, minutes, goals, assists, cards, shots, passes, duels, AND an average
    `rating` → API-Football GET /players?id=&season=2026 (statistics[] per competition).
  - Per-match log (the "Matches" tab: date, opponent, score, W/L/D, rating, minutes, goals, assists, cards)
    → API-Football GET /fixtures/players?fixture={id}. ONE call returns EVERY player in that fixture, so
    ~50-60 WC26 fixtures covers all 20 players. Budget it (see Step 3).
❌ DO NOT BUILD — no free source exists, and inventing them is the fake-proofs defect class:
  - "Player value / 10.4M €" (market value)   - "3.1M followers"
  - Sofascore's ATT/TEC/TAC/DEF/CRE radar (their proprietary model)
  - Heatmaps · Media/video tab · Fantasy tab
⚠️ DERIVE-AND-LABEL (allowed, and better than copying):
  - You MAY build an attribute radar from REAL per-90 stats (attacking = goals+shots+dribbles per 90;
    creation = assists+key passes; defending = tackles+duels won; etc.), normalised against the other 19.
    It MUST be labelled "Ninety index — derived from per-90 stats, not an official rating," with the inputs
    named on hover. Never present a derived number as an authoritative rating.

STEP 3 — BAKE IT (API-Football is 100 requests/DAY — this is the binding constraint)
Budget: 20 × /players?id= (20 calls) + ~55 × /fixtures/players?fixture= (55 calls) ≈ 75 of 100. Tight but
fits ONE day. Therefore:
  - Bake ONCE to apps/web/src/data/wc26/player-profiles.json, commit it, and NEVER call at runtime.
  - Write the script to be RESUMABLE: persist after every call, skip what's already cached, so a 429 or a
    crash doesn't cost you the day's budget. Log remaining budget as you go.
  - Dedupe fixtures across the 20 players before fetching — the same WC fixture serves many players.
  - If the budget runs out mid-bake: ship the players you completed with honest empty states on the rest.
    Never pad with invented numbers.

STEP 4 — THE PAGE
Layout mirrors the reference's information hierarchy (see the images):
  - Header card: 96px circular photo · name (system font, large, semibold) · club crest + club + contract ·
    then a metadata strip of icon+value pairs (flag+nationality · DOB (age) · position · height · foot ·
    shirt number). All numbers mono+tabular.
  - Right of header: "Previous match" card (competition emblem, date, FT, both teams + score).
  - Tabs: Matches · Season · Career — ONLY tabs with data. No empty Fantasy/Media tabs (an empty tab a
    judge clicks is worse than an absent one).
  - Matches table: competition icon · date/FT · both teams + score · W/L/D pill (--up / --down / --text-lo) ·
    rating chip (colour-scaled through Ninety tokens) · minutes · goals · assists · cards.
  - "Summary (last 12 months)" bar chart of monthly average rating — only if enough real matches exist to
    plot; otherwise omit the card entirely rather than render a sparse/misleading chart.
  - Prose summary paragraph generated from the REAL baked fields (age, height, club, foot, last match) —
    template-filled from data, never LLM-invented facts.

STEP 5 — THE NINETY DIFFERENTIATOR (do this; it's why our page beats a clone)
Add a **"Market impact"** panel no stats site can show: for each goal this player scored, the price swing it
caused on our market. Source it from our own Moment/market-event data (the biggest-swing Moments are already
modelled). E.g. "74' vs Morocco — CAN to win 41.0 → 61.4 (+20.4)". This is the "price is probability" story
told at player level, from OUR data, and it's the panel a judge remembers.
Copy law applies: price · trade · credits. NEVER bet/stake/odds/wager.

STEP 6 — PHOTOS (decide, then record in the ADR)
Player photos come from API-Football's media CDN. Two options, pick one and write it down:
  (a) Bake the 20 PNGs locally into public/players/ (consistent with ADR-055's no-runtime-CDN stance) —
      CHECK API-Football's terms on redistribution first and note the finding in the ADR.
  (b) No photos: initials-in-a-circle avatars using team colours. Ships zero legal risk, still looks clean.
If (a)'s terms are unclear, take (b). We already learned this lesson on the Iron Man clip.

STEP 7 — VERIFY (Verification law)
  - Do NOT run a verification server — verification is one merged pass on the main tree (PARALLEL-PLAN.md).
  - Have ready for that pass: 3 player pages at lg+xl (a striker with many matches, a player with few, and
    one with a partial/failed bake so the empty states are proven).
  - READ-OUT-LOUD every page: age vs DOB, minutes vs matches, goals in the table vs the season total, the
    "Previous match" card vs the top row of the table. Any disagreement is a ship-blocker.
  - Every player row in search + every lineup name must now resolve to a real /player/[id] — zero 404s.
  - ADR-082 records: the top-20 derivation query, the exact API budget spent, the photo decision, and every
    field we deliberately DO NOT show (value, followers, radar) and why.
```

---

## Why this isn't just a clone (note for Sushant)

The reference page is ~40% things our tier can't source: market value, follower counts, and Sofascore's
proprietary attribute model. Faking any of them is the same defect as the fabricated Solscan links.

So the prompt does three things instead: it **derives** an attribute radar from real per-90 stats and labels
it honestly as a Ninety index; it **drops** the unsourceable panels rather than padding them; and it **adds
a Market-impact panel** — the price swing each of the player's goals caused on our market — which no stats
site can show, because they don't run a market. That panel is the reason to build this page at all.

## Parallel note

Session C is independent of A and B: different route file, different page, different baked JSON, and it
spends the **API-Football** budget while Session B spends **football-data**. Two different keys, so B and C
can genuinely overlap. The one rule: C must not edit `richdata.ts` (Session A) or `search.ts` /
`CommandMenu.tsx` (Session B), and search rows only start linking to `/player/[id]` after C lands.
