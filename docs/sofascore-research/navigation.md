# Navigation

SofaScore's navigation is a **layered, always-present system**: global chrome that never changes,
plus contextual tabs that change per entity. Nothing is more than ~2 interactions from anything.

## Layer 1 — Global header (sticky, z-104, ~160px desktop)

Three stacked rows:

1. **Match ticker** (top strip, dark gradient) — 2–3 featured/live matches with time + flags,
   horizontally. A persistent "what's hot right now" rail. Clickable to the match.
2. **Identity row** — logo (left) · **global search** (center, ~510px wide, always visible) ·
   account (Sign in) · favourites (★) · live (⚡) · settings (⚙) (right).
3. **Sport switcher** — horizontal tabs with live-count badges: Trending · WC26 · Football `35` ·
   Cricket `1` · Tennis `40` · Basketball · Table tennis `28` · Baseball · Motorsport · Badminton ·
   Volleyball · American football · **More (…)**. Far right: **News · Fantasy · Torneo** (adjacent
   products). Active sport is underlined + colored.

Key ideas:
- **Search is always on screen**, never behind an icon-only affordance on desktop. Search is the
  fastest path to any entity, so it gets permanent real estate.
- **Live counts are in the nav itself** (`Football 35`) — you see where the action is before
  clicking. The number is live.
- **Overflow via "More (…)"** rather than wrapping — the sport list is long but stays one row.

## Layer 2 — Sub-navigation (list controls, sticky z-98/99)

On the scores home, directly under the header:
- **Scope tabs:** All · Favourites · Competitions
- **Date stepper:** `‹ Today ›` (prev/next day; "Today" resets)
- **State filter chips:** Live `(35)` · Finished · Upcoming
- **Odds toggle** (off by default)

These pin under the global header as you scroll (the sticky-99/98/97 layers). See
[`components/filters-and-chips.md`](components/filters-and-chips.md).

## Layer 3 — Entity tabs (per-page, the depth mechanism)

Each entity page carries its own horizontal tab bar (see [`architecture.md`](architecture.md)):

| Entity | Tabs |
|---|---|
| Match | Details/Commentary · Lineups · Statistics · Standings · H2H · Media |
| League | Standings · Details · Media (+ fixtures: By date / By round) |
| Player | Matches · Season · Career · Fantasy · Media |
| Team | Overview · Matches · Squad · Stats · Standings · Transfers |

Sub-tabs nest inside (e.g. Lineups → *Lineups / Player stats*; Standings → *All / Home / Away*;
incident feed → *All / Key events*). Nesting is shallow (2 levels) so users don't get lost.

## Layer 4 — Cross-links (lateral movement)

Every crest, player name, team name, and competition label is a link to that entity. From a match
you can reach either team, any player, the league standings, and H2H — without going "up" to a menu.
The graph is densely interlinked; the back button and breadcrumb are rarely needed.

## Mobile (≤ md 992px)

- Header collapses **160 → 96px**: the match ticker drops; logo + search + sport nav remain.
- Sport nav becomes a **horizontally scrollable** strip (swipe through sports).
- On the *web* build there is **no bottom tab bar** — that's the native-app pattern. Web keeps the
  top sticky nav. (Ninety should decide this deliberately; a bottom bar is an app affordance.)
- Entity tabs become horizontally scrollable; content is single-column.

## Takeaways for Ninety

1. **Keep global search permanently visible on desktop** — it's the fastest path to any market. Ours
   should search matches, teams, players, and markets.
2. **Put live signal in the nav** — e.g. a live-market count / "in-play" badge on the primary nav,
   the way `Football 35` tells you where action is.
3. **Depth via per-entity tabs**, shallow nesting (≤2 levels). A market page = one URL with
   Trade · Order book · Trades · Chart · Rules tabs, not five separate pages.
4. **Everything is a link** — crest → team, name → player, league → standings. Build the lateral
   graph so users never dead-end.
5. **Layered sticky sub-nav** (market header pins, then tab bar pins under it) using a declared
   z-index contract.
