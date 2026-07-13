# Screen — Player Profile

## Purpose & primary goal
Everything about one player. Goal: **form, quality, and history** — how they've rated recently,
season output, career arc, market value.

## Visual hierarchy
1. Player header (photo, name, club, position, shirt no., nationality).
2. **Season rating** + recent-match rating trend.
3. Attribute overview + heatmap.
4. Season/career stat tables.

## Navigation structure
Primary tabs: **Matches · Season · Career · Fantasy · Media**.

## Component inventory
- Player header
- **Rating badge / rating trend** — [`../components/rating-badge.md`](../components/rating-badge.md)
- **Data-viz: heatmap, attribute radar/pentagon, per-match rating sparkline, position map** —
  [`../components/data-viz.md`](../components/data-viz.md)
- Stat tables (season splits) — [`../components/standings-table.md`](../components/standings-table.md)
- Tabs

## Key observation: everything visual is SVG
The player page rendered **152 `<svg>` nodes and 0 `<canvas>`.** Heatmaps, radars, sparklines, and
gauges are all SVG. Implications: crisp at any DPI, animatable via CSS/JS, inspectable/accessible,
and themeable via tokens. This is a deliberate, high-craft choice for a data product and directly
relevant to Ninety's charts.

## Interaction model
- Tabs switch dataset views.
- Season/competition selectors filter stats.
- Match rows (in Matches tab) → match pages; each carries that match's rating.
- Hovering a heatmap/radar reveals values (tooltips).

## States
- **Active season:** live rating updates as matches complete.
- **Retired / no data:** career-only; graceful "no recent matches."
- **Loading:** skeletons for the header + chart blocks.

## Motion
Chart mounts animate subtly (draw-in for radars/lines) within the duration scale; tab cross-fade.

## Responsive
`<md`: single column, header stacks, charts go full-width, stat tables scroll horizontally.

## Premium signals
- The **rating trend** (a colored per-match sparkline using the rating ramp) tells a form story at a
  glance.
- The **attribute radar** distills a player to a shape you can compare visually.
- SVG crispness — the charts never look rasterized.

## Lesson for Ninety
Our **player/trader profile** (or a market-participant page) should treat charts as
**system components rendered in SVG**, themed by tokens, animated within the duration scale — never
a rasterized chart lib dropped in. The rating-ramp sparkline is the model for a **P&L / accuracy
trend**. (We already use `lightweight-charts` for the Momentum River — keep small inline trend viz
as SVG for crispness/consistency.)
