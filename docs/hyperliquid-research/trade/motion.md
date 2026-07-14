# trade — Motion

A trading terminal's motion budget is tiny by design: **motion = information, never decoration.**

## What animates
- **Live value flashes.** Prices, mark, order-book cells, PnL recolor (green up / red down) on
  change and settle — a short attention pulse (~100–200ms). This is the primary "motion" of the app.
- **Order-book depth bars** ease their width as cumulative totals shift (subtle, ~100–150ms).
- **Trade tape** prepends new rows with a quick fade/slide from the top.
- **Tab / panel switches** cross-fade content fast (~120–150ms); segmented toggles (Buy/Sell,
  Market/Limit) slide the active indicator.
- **Announcements popover** slides in from the corner; wallet/Privy modal fades + scales in.
- **Chart** interactions (crosshair, zoom, pan) are immediate/native to the canvas engine.

## What does NOT animate
- The **layout never reflows** on data updates — rows patch in place; columns are fixed-width
  (tabular). No entrance choreography on the numbers' first paint (information must be instant).
- No parallax, no scroll effects (it's a fixed terminal, not a scroll page).

## Timing feel
Everything is **snappy** (50–200ms). A trader switches tabs and markets constantly; slow transitions
would be friction. Flashes are brief; nothing bounces (exactness > playfulness).

## For Ninety
- Adopt the **flash-on-change** for our price + order rows (we already mandate 180ms up/down flash).
- **Patch, don't reflow.** Fixed-width tabular columns; update cells only.
- Reserve any *expressive* motion for the **Momentum River** hero; the terminal chrome stays near-still.
- Honor `prefers-reduced-motion` → flashes become instant recolors.
