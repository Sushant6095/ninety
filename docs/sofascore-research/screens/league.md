# Screen — League / Tournament

## Purpose & primary goal
The home of a competition. Goal: **standings + fixtures + who's performing.** Answers "where does my
team sit, when do they play, who leads the stats."

## Visual hierarchy
1. Competition header (crest, name, season selector).
2. **Standings table** — the anchor.
3. Fixtures (by date / by round) + top players/teams stat leaders.

## Navigation structure
Primary tabs: **Standings · Details · Media**.
Standings view filter: **All / Home / Away**.
Fixtures view toggle: **By date / By round** with a round selector (`Round 1…`).
Season selector (dropdown) switches the whole page's dataset.

## Component inventory
- Standings table (div-based, not `<table>`) — [`../components/standings-table.md`](../components/standings-table.md)
- Tabs + segmented filters — [`../components/tabs.md`](../components/tabs.md),
  [`../components/filters-and-chips.md`](../components/filters-and-chips.md)
- Fixture rows (same match-row primitive as home) —
  [`../components/match-list-and-row.md`](../components/match-list-and-row.md)
- Stat-leader rows (player row + value)

## Standings table anatomy
Columns: **# · Team (crest+name) · P · W · D · L · Goals (for:against) · Form (last-5 dots) · Pts**.
- **Promotion/relegation** encoded as a colored left edge per row, with a legend (dedicated tokens:
  `playoffs-promotion-to-x/y/z`, `playoffs-relegation`).
- **Form** column = 5 small result dots (W green / D grey / L red) — a sparkline of recent results.
- Numbers right-aligned, tabular. The current/selected team row highlights.

## Interaction model
- All/Home/Away recomputes the table in place (client-side).
- Season/round dropdowns re-fetch and cross-fade.
- Every team row → team page; the fixtures rows → match pages.
- Table row hover wash; sortable columns where relevant.

## States
- **Loading:** skeleton table rows.
- **Pre-season / new season:** table exists with zeros; fixtures populate.
- **Empty:** cups without a table show the bracket / group stage instead (structure adapts to
  competition type).

## Motion
Table view-filter cross-fade ~120ms; dropdown open 200ms. Nothing heavy.

## Responsive
`<md`: standings table stays a table but sheds/condenses columns (P/W/D/L may collapse behind a
horizontal scroll or a compact variant); fixtures single-column.

## Premium signals
- The **form dots** turn "recent results" into an instant glance — micro-dataviz inside a table.
- Promotion/relegation color-edges make the *stakes* of the table legible without reading a legend.
- The same match-row primitive from home reappears here — consistency = learnability.

## Lesson for Ninety
Our **leaderboard** (`/leaderboard`, already built) is the analog. Borrow: rank + entity + fixed
numeric columns + a "form"/trend micro-viz (recent P&L sparkline) + edge-color for tiers
(top/rising/at-risk). And reuse *one* row primitive across leaderboard, positions, and trade tape.
