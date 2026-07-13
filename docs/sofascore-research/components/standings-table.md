# Component — Standings Table

A dense, div-based table (not `<table>` markup) for league standings and season stat splits.

## Anatomy
Columns: **# · Team (crest + name) · P · W · D · L · Goals (F:A) · Form · Pts**
- **Position** left; **Pts** right (the two anchors).
- **Goals** as `F:A` or a diff column.
- **Form** = 5 result dots (W green / D grey / L red) — a mini-sparkline of recent matches.
- **Promotion/relegation** = a **colored left edge** per row + a legend below, using dedicated
  tokens (`playoffs-promotion-to-x/y/z`, `playoffs-relegation`, colors like `#49cb40` promo,
  `#c1262d` relegation). Zones are visible *before reading the legend*.
- Selected/your team row highlighted.

## Variants
- **View filter:** All / Home / Away (recomputes W-D-L-Pts for that split).
- **Compact** (mobile: sheds P/W/D/L behind horizontal scroll, keeps #/Team/Pts).
- **Group stage** (multiple mini-tables) vs **single league** vs **bracket** (cups swap the table
  for a bracket entirely — structure adapts to competition type).

## States
- **Loading:** skeleton rows.
- **New season:** zeros, no form dots yet.
- **Live matchday:** rows can update as results finalize (positions can reorder).
- **Hover:** row wash; **focus:** ring.

## Interaction
Team row → team page. Column headers sortable where meaningful. View-filter chips cross-fade the
body (~120ms). Season/round dropdown re-fetches.

## Motion
Filter cross-fade ~120ms; on live reorder, rows can animate to new positions (subtle, within scale).
No heavy reflow animation.

## Spacing
Very tight rows; hairline dividers; numbers right-aligned + tabular so columns are pixel-true. The
condensed font lets long club names fit without wrapping.

## Accessibility
Even as divs, needs table semantics (`role="table"/"row"/"cell"` + column headers) so screen readers
can navigate. Form dots need text alternatives (`"last 5: W W D L W"`). Promotion color must not be
the *only* signal — pair with the legend text/label.

## When to use
Ranked, multi-column comparison of many entities on the same metrics.

## When NOT to use
For 2–3 items (use rows/cards) or for non-ranked lists. Don't add so many columns that mobile can't
shed them gracefully.

## Ninety translation
Our **leaderboard** and **positions** tables. Steal: fixed numeric columns (tabular, right-aligned),
a **form/trend micro-viz** column (recent P&L sparkline instead of W/D/L dots), **edge-color tiers**
(top / rising / at-risk), highlight "you", and a graceful mobile column-shed that never drops the
identity + headline number.
