# Component Inventory

Reusable UI primitives reverse-engineered from SofaScore. Each file documents purpose, variants,
states, interaction, motion, spacing, accessibility, when-to-use / when-not, composition, and the
**Ninety translation** (how we adapt the pattern for a live football trading exchange — without
copying assets or code).

## Signature (SofaScore's distinctive craft)
- [`match-list-and-row.md`](match-list-and-row.md) — the most-reused pattern: league accordion + match row
- [`score-header.md`](score-header.md) — the focal match header (→ our market header)
- [`incident-timeline.md`](incident-timeline.md) — alternating home/away event spine
- [`rating-badge.md`](rating-badge.md) — the rating pill + color ramp (the top steal)
- [`standings-table.md`](standings-table.md) — dense table, form dots, promo/relegation edges
- [`data-viz.md`](data-viz.md) — the SVG chart family (one visual language)
- [`vote-and-poll.md`](vote-and-poll.md) — "Who will win?" (the component Ninety *converts to a market*)

## Structural / generic
- [`tabs.md`](tabs.md) — the depth mechanism (primary underline + segmented)
- [`filters-and-chips.md`](filters-and-chips.md) — state chips, date stepper, odds toggle, scope tabs
- [`search.md`](search.md) — global entity search
- [`controls.md`](controls.md) — button, toggle, dropdown, tooltip
- [`overlays.md`](overlays.md) — modal, drawer, bottom sheet, toast, skeleton
- [`surfaces.md`](surfaces.md) — surface ramp, cards, spotlight (inverted) surface, ad slots

> Coverage note: this set folds the smaller primitives the brief listed (score badge, stat row,
> player row, odds chip, probability badge, accordion, context menu, carousel) into the file where
> they naturally live — e.g. the odds chip and probability badge under `match-list-and-row` /
> `vote-and-poll`, the accordion under `match-list-and-row` / `filters-and-chips`, stat/player rows
> under `standings-table` / `data-viz`, the featured carousel under `screens/home`. Grouping by real
> composition keeps the docs honest to how the product is actually built.
