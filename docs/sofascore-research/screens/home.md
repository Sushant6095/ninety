# Screen — Home (Live Scores)

> Reference shots: `../_reference-shots/sofa-home-top.png`, `sofa-home-initial.png`

## Purpose & primary goal
The daily scoreboard. Primary user goal: **"what's happening in football right now, and what's
coming"** — scan live/finished/upcoming matches across all competitions, jump into anything.

## Visual hierarchy
1. **Match ticker** (top) — the hottest featured matches.
2. **Center featured card** — a single spotlighted event (WC26 semifinal) + crowd vote.
3. **Left match list** — the dense body of the page (all competitions, grouped).
4. **Team of the week / editorial** — secondary engagement.
5. **Right rail** — ads (deprioritized, visually walled off with an "Advertisement" label).

Color hierarchy: chrome is monochrome + one blue; the eye is pulled to *live-red* rows, *green/blue*
team dots, and *colored rating badges*. Nothing else competes.

## Navigation structure
Global header (ticker · search · sport nav) → sub-nav (All/Favourites/Competitions · date stepper ·
Live/Finished/Upcoming · Odds toggle) → league accordion groups → match rows. See
[`../navigation.md`](../navigation.md).

## Component inventory
- League accordion header (crest · name · country+flag · count badge · chevron)
- Match row (time/status · home over away · score column · favourite ★) —
  [`../components/match-list-and-row.md`](../components/match-list-and-row.md)
- Filter chips + date stepper — [`../components/filters-and-chips.md`](../components/filters-and-chips.md)
- Featured event card + **Who-will-win vote** — [`../components/vote-and-poll.md`](../components/vote-and-poll.md)
- Team-of-the-week pitch viz — [`../components/data-viz.md`](../components/data-viz.md)
- Rating badges — [`../components/rating-badge.md`](../components/rating-badge.md)
- Ad slots (right rail + inline banner)

## Layout / grid
Three zones on `#edf1f6`: left list (~570px, white card) · center detail (~530px) · right ad rail
(~300px). 12px default gaps; cards at 12–16px radius. List rows separated by hairlines, not gaps.

## Interaction model
- **Filter chips** switch the list scope instantly (client-side; no full reload).
- **Date stepper** pages the whole list by day.
- **Accordion** headers expand/collapse league groups (~200ms).
- **★** toggles a favourite (persists to Favourites tab).
- **Odds toggle** reveals an odds column inline — additive, not a mode switch.
- Rows are entirely clickable → match page; inner crests/names → team pages.

## States
- **Loading:** skeleton rows (grey blocks matching row rhythm) appear within ~300ms; cross-fade to
  data ~300ms. The layout doesn't shift (row heights reserved).
- **Live:** live matches carry a red minute + subtle pulse; score flashes on change.
- **Empty:** a day with no matches for the scope shows a centered empty message, not a blank rail.
- **Hover:** row gets a faint `neutral-highlight #e8ecf3` wash; ★ and chevron darken.
- **Focus:** keyboard focus ring on interactive rows/controls.

## Motion
Accordion 200ms, chip select 150ms, score flash ~180ms, skeleton→content ~300ms. No scroll
choreography. Sticky sub-nav pins under the header.

## Responsive
`≥lg 1344`: full three-zone. `md–lg`: right rail drops first. `<md 992`: single column, list only,
featured content stacks below; header 96px. See [`responsive.md`](responsive.md).

## Premium signals
- The list carries *dozens of competitions* legibly because of hairline separation + tabular numbers
  + condensed font in tight cells. Density without noise.
- Live-count badges in the nav (`Football 35`) before you even scroll.
- The featured card's dark spotlight surface (`surface-t`) inside a light page — a confident
  focal contrast.

## Improvable (our opportunity)
- The right rail is **pure ad**, which flattens value — Ninety replaces it with live market data
  (book/positions/tape).
- A lot of the center is a *poll* ("cast your vote"). We convert that engagement energy into a
  **tradable price** — same instinct (predict the winner), real stakes (play-money credits).
- Empty/near-empty center on first load; Ninety's center should always show the live price.
