# Information Architecture

## The mental model

SofaScore organizes the entire sports world into a small set of **entity types**, each with a
canonical page, all reachable from one global search and one sport switcher:

```
Sport ──▶ Category (country / region) ──▶ Tournament (league/cup) ──▶ Season
                                                     │
                              ┌──────────────────────┼───────────────────┐
                              ▼                       ▼                    ▼
                            Match ◀── Team ──▶ Player            Standings / Stats
                              │         │         │
                          (event)   (squad)   (career)
```

Every screen is one of: **Home (scores)**, **Match**, **Tournament/League**, **Team**, **Player**,
**Search**, **Settings**, plus editorial (**News**) and adjacent products (**Fantasy**, **Torneo**).
That's the whole app. The power comes from how *consistently* the same skeleton is re-parameterized.

## URL model (clean, entity-based, shareable)

Observed patterns:
```
/                                                     scores home
/football/match/avai-nautico/lPspWc#id:15526174       match (slug + short code + numeric id)
/football/tournament/england/premier-league/17#id:…   tournament
/football/player/erling-haaland/839956                player
/football/team/…                                      team
```
- **Sport is the first path segment** (`/football/…`) — the whole IA is namespaced per sport.
- **Human slug + stable numeric id** in every URL — SEO-friendly *and* durable if a name changes.
- The `#id:` fragment carries the live entity id for the SPA to hydrate.

Lesson: URLs are entity-addressable and shareable. For Ninety, market/match/team URLs should follow
the same slug+id shape (`/match/{teams}/{id}`, `/market/{id}`) so any state is linkable.

## Layout skeleton (desktop)

A persistent **three-zone shell** wraps every page:

```
┌───────────────────────────────────────────────────────────────┐
│  STICKY HEADER (z-104, 160px): match ticker · logo+search ·     │
│                                sport nav · News/Fantasy/Torneo  │
├──────────────┬────────────────────────────┬────────────────────┤
│ LEFT RAIL    │  CENTER DETAIL CANVAS       │  RIGHT RAIL         │
│ (~570px)     │  (~530px)                   │  (~300px)           │
│ list/context │  the selected entity        │  ads + widgets      │
│ (match list, │  (match, standings,         │  (podcast, promos,  │
│  nav tree)   │   player profile…)          │   related content)  │
└──────────────┴────────────────────────────┴────────────────────┘
```

- **Left rail = context/navigation** (the scores list, or a league's structure). It persists so you
  can jump between matches without losing your place.
- **Center = the detail canvas.** Changes per selection. This is where depth lives (tabs).
- **Right rail = monetization + ancillary.** Ads, podcast, cross-promotion. This is the zone Ninety
  should *repurpose*, not copy — for us it's live order book / trade tape / positions.

Below `md (992px)` the rails collapse and the center canvas becomes the whole screen.

## Depth strategy: tabs + progressive disclosure

SofaScore holds an enormous amount of data per entity without overwhelming, by **hiding depth behind
tabs and accordions**, not behind navigation to new pages:

- A **match** page is one URL with tabs: Details/Commentary · Lineups (→ Player stats) · Statistics
  · Standings · H2H · Media. Sub-tabs nest further (incident feed: All / Key events).
- A **league** page: Standings (→ All/Home/Away) · Details (top players/stats) · Media, plus a
  fixtures view toggle (By date / By round).
- A **player** page: Matches · Season · Career · Fantasy · Media.

You rarely leave an entity page; you *drill into it*. This keeps context and makes the product feel
deep rather than sprawling. (This is exactly the "depth-in-tabs" our ui-craft skill borrows from
SofaScore.)

## Live-data model (inferred from behavior + network)

- The SPA hydrates static entity data, then **streams live updates** (scores, minutes, incidents,
  ratings) — values update in place and flash on change.
- Data is **normalized per entity**; the same match object powers the home ticker, the list row, and
  the full match page — so a score is consistent everywhere the instant it changes.
- Reference/odds data is *layered in optionally* (the Odds toggle), never core to the layout.

## What Ninety inherits vs rejects

| Inherit | Reject |
|---|---|
| Three-zone persistent shell; center detail canvas | Ad-driven right rail (→ order book / positions / trade tape) |
| Entity-addressable slug+id URLs | Read-only, passive stance (we are a live market) |
| Depth-in-tabs; rarely leave an entity | Light-mode default (we are dark-first v1) |
| One consistent skeleton re-parameterized | Poll/reference-only data (our numbers are tradable prices) |
| Live-normalized single source of truth per entity | — |
