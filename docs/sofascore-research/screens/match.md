# Screen — Match Detail (the crown jewel)

> Reference shot: `../_reference-shots/sofa-match-top.png`

The most information-dense, most-visited screen, and the clearest lesson for Ninety's **market
page**. One URL holds an entire match's worth of data behind tabs.

## Purpose & primary goal
Everything about a single match: live score & clock, how it's unfolding (incidents, momentum),
who's playing (lineups, ratings), the numbers (statistics), context (standings, H2H), and media.
Goal: **follow or relive a match in full without leaving the page.**

## Visual hierarchy
1. **Score header** — teams, crests, score (28px/700), status/minute, competition + round.
2. **Momentum / attack-pressure graph** — the "story so far" (see data-viz).
3. **Active tab content** — incident timeline by default.
4. Contextual blocks: referee (avg cards), managers, substitutions, formation.

## Navigation structure
Primary tabs: **Details/Commentary · Lineups · Statistics · Standings · H2H · Media**.
Sub-tabs: incident feed *All / Key events*; Lineups → *Lineups / Player stats*; a squad-breakdown
chart toggling *Performance · Nationality · Age · Market value · Height*.

## Component inventory
- Score header — [`../components/score-header.md`](../components/score-header.md)
- Incident timeline (goals w/ video, cards, subs on an alternating home/away spine) —
  [`../components/incident-timeline.md`](../components/incident-timeline.md)
- Momentum graph, formation pitch, shotmap, stat bars —
  [`../components/data-viz.md`](../components/data-viz.md)
- Rating badges on every player — [`../components/rating-badge.md`](../components/rating-badge.md)
- Tabs — [`../components/tabs.md`](../components/tabs.md)
- Stat rows (mirrored home | value | away bars)

## Layout / grid
Left rail: live incident timeline + best-player spotlight (persists). Center: score header + tab
content. Right rail: ads. On a match the **left rail is the live feed** — the thing you glance at
repeatedly — while the center is the deep dive.

## Interaction model
- Tabs switch content with a cross-fade (~120–200ms); the active underline slides.
- Incident feed filter (All / Key events) trims the timeline in place.
- Goals expose an inline **video play** affordance.
- Player names/crests are links (→ player/team pages).
- Squad-breakdown chart re-renders on dimension toggle.

## States
- **Pre-match:** header shows kickoff time; content = lineups (predicted), H2H, standings, form.
- **Live:** minute ticks in red; score flashes on goals; timeline prepends new incidents; momentum
  graph extends; ratings update live. This is the highest-value live state in the product.
- **Finished:** "FT" badge; full stats, final ratings, "team of the match."
- **Loading:** skeletons per block; screenshot capture on this page repeatedly timed out precisely
  *because* it never network-idles — the live socket + ads keep it busy (a real observation).
- **Empty tabs:** lower-tier matches with no lineup/stats show a graceful "not available" per tab.

## Motion
All within the 50–500ms scale. Live incidents animate in (~200ms). Score flash ~180ms. Momentum bar
grows smoothly. No decorative motion on the numbers.

## Responsive
`<md`: single column — score header, then the tab bar (scrollable), then stacked content; the live
timeline moves inline under the header rather than a side rail.

## Premium signals
- **One page, total depth.** You never leave to compare standings or check H2H.
- **The alternating incident spine** is instantly readable: home events left, away events right,
  minute in the middle. Spatial encoding does the work.
- **Live ratings** update per player as the match unfolds — a sense of a living document.
- Referee card with *average cards* stat — the obsessive completeness that signals authority.

## The lesson for Ninety's market page
This screen is the template for a **market page**: keep the live number (for us, the *price* +
Momentum River) pinned at top; put depth (Order book · Trades · Chart · Rules · Standings/H2H
context) behind shallow tabs; run a **live event feed** in a side rail (goals, halts, big trades)
that updates in place. Replace SofaScore's *read-only* ratings/vote with *tradable* prices, and the
right ad rail with the **order book + your positions**.
