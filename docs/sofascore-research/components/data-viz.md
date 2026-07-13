# Component — Data Visualization (SVG suite)

SofaScore's charts are a coherent family, all **SVG** (the player page rendered **152 `<svg>`, 0
`<canvas>`), themed by the token system, animated within the 50–500ms duration scale. They are
treated as *design-system components*, not afterthoughts — the difference between a stats site and a
premium one.

## The suite

| Viz | Where | Encoding |
|---|---|---|
| **Formation pitch** | Match lineups | Player nodes on a scaled pitch (`graphics-terrain-football #cbedbf`), each with a rating badge; home/away halves |
| **Momentum / attack-pressure graph** | Match | Time on X, pressure toward home (green) / away (blue) — the "story so far" |
| **Shotmap** | Match | Shots plotted on goal/pitch; color = outcome (goal/miss/saved), size = xG |
| **Stat bars (mirrored)** | Match statistics | `home value ◀──┃──▶ away value` paired horizontal bars per stat (possession, shots…) |
| **Heatmap** | Player/team | Position density on the pitch using the heatmap ramp (`hm_1 pale-green → hm_5 red`) |
| **Attribute radar/pentagon** | Player | Multi-axis shape (attacking/defending/…); compare two players by overlaid shapes |
| **Rating sparkline** | Player | Per-match rating over time, colored by the rating ramp |
| **Squad-breakdown chart** | Match/team | Toggles dimension: Performance · Nationality · Age · Market value · Height |

## Shared principles (the real lesson)
1. **One visual language.** Same green=home/blue=away, same rating ramp, same heatmap ramp, same
   type + tabular numbers across every chart. Charts feel like one system, not a gallery of libs.
2. **Color is the data.** Hue/intensity carry meaning (momentum side, rating grade, heat density) —
   never decorative gradients.
3. **SVG for crispness + theming + a11y.** Vector-sharp at any DPI, restyleable via tokens,
   inspectable, animatable.
4. **Restrained motion.** Draw-in on mount (lines trace, bars grow) within the duration scale; live
   charts extend smoothly; no gratuitous motion.
5. **Always paired with the number.** Every chart has its exact values available (label/tooltip) —
   the viz is a fast read, the number is the truth.

## States
- **Loading:** skeleton box of the chart's footprint (no layout shift).
- **Live:** momentum/rating charts extend/update in place.
- **Empty:** "not available for this match/player" placeholder at the chart's size.
- **Hover/focus:** reveal exact values via tooltip; keyboard-focusable data points where feasible.

## Accessibility
Charts carry text summaries / data tables as alternatives; tooltips give exact values; color is
never the sole encoding (position, shape, and labels reinforce).

## Ninety translation
Our **Momentum River** is the direct analog of the momentum graph — and per ADR-052 it's the
sanctioned "loud" surface where boldness lives (GSAP choreography, River draw). Beyond it:
- Keep **small inline trend viz as SVG** (P&L sparklines, implied-probability bars, position
  heatmaps) themed by tokens — one visual language across the app.
- **Color = the data** (up/down/halt intensity), always paired with the exact price/number.
- Use `lightweight-charts` for the heavy price chart (already adopted), SVG for the small system
  viz — mirroring SofaScore's "right tool, one language."
