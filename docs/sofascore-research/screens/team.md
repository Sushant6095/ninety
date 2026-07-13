# Screen — Team Profile

> Note: documented from the shared page skeleton + entity-link behavior observed elsewhere; the
> team page reuses the same primitives as league/player, so its patterns are inferable with high
> confidence. Values not independently re-measured are marked (~).

## Purpose & primary goal
The hub for one club/national team. Goal: **next/last matches, squad, form, where they sit.**

## Visual hierarchy
1. Team header (crest, name, country, current competition).
2. Next match + recent form.
3. Standings snapshot / squad / stats.

## Navigation structure (~)
Primary tabs: **Overview · Matches · Squad · Statistics · Standings · Transfers** (typical for the
entity; exact labels vary by team/sport).

## Component inventory
- Team header
- Next-match card + form dots (same form micro-viz as standings)
- Match rows (shared primitive) — [`../components/match-list-and-row.md`](../components/match-list-and-row.md)
- Squad list = **player rows** (crest/photo · name · position color dot · rating) —
  [`../components/rating-badge.md`](../components/rating-badge.md)
- Standings table (team row highlighted) — [`../components/standings-table.md`](../components/standings-table.md)
- Tabs

## Interaction model
Tabs switch views; player rows → player pages; matches → match pages; competition → league page.
The team's own row is always highlighted in any table it appears in (spatial "you are here").

## States
Live: if the team is playing now, the next-match card becomes a live card (red minute, live score).
Off-season: shows last results + upcoming fixtures + transfers.

## Responsive
`<md`: single column; squad list stays a dense row list; header stacks.

## Premium signals
- Reuse of the *same* row/table/rating primitives from every other screen — the team page teaches
  nothing new, which is the point: **zero learning cost.**
- The team's row highlighted inside the league table = instant orientation.

## Lesson for Ninety
A **team page** in Ninety = the club's markets (win/advance/top-scorer markets), its live match
market, recent price history, and where it ranks. Reuse the market-row and leaderboard-row
primitives; highlight "markets you hold" the way SofaScore highlights the current team.
