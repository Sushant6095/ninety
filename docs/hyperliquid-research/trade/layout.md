# trade — Layout & Design System

## Zone grid (desktop)
A **fixed full-viewport terminal** (no page scroll; each panel scrolls internally). Roughly:
```
Top nav          : full width, ~56px, fixed
Chart panel      : ~left 62% of the middle row (flexes)
Order book/Trades: ~center-right ~19% column
Trade ticket     : ~right ~19% column (fixed ~320px)
Bottom dock      : full width, positions/orders tabs (~resizable height)
```
Panels are separated by 1px hairlines (`#1F2937`-ish borders). The layout is **resizable/modular**
(pro terminals let users drag splits); the ticket column is a stable ~320px.

## Color system (dark, semantic-only)
| Role | Value |
|---|---|
| App surface (deepest) | near-black (panels); body fallback `#303030` |
| Text (primary) | `#D2DAD7` off-white (slightly green-grey) |
| **Up / Long / bid** | `#1FA67D` green |
| **Down / Short / ask** | `#ED7088` pink-red |
| Highlight / positive accent | `#F6FEFD` near-white mint |
| Wallet accent (Privy) | `hsl(172,47%,36%)` teal-green |
| Borders / hairlines | `#1F2937` |
Depth bars behind order-book rows use translucent green/red fills (size visualization). Semantic
color is the *only* color — there is no decorative palette.

## Typography
- **One family: "OurFont"** (custom). Fallback system stack.
- **Weights: 400 / 500 only.** Hierarchy from size + color + weight-500 emphasis.
- **Tabular numerals everywhere** (436 nodes) — `font-feature-settings: 'tnum'`. Prices, sizes,
  totals, PnL, times all align in fixed columns.
- Sizes: small and tight — ~11–13px for table/book rows, ~13–14px labels, larger for the pair
  symbol + mark price. This is a *density-first* type program.

## Numeric formatting
- Prices to instrument precision (e.g. `63.779`), selectable book grouping (`0.001`).
- Live values **flash / recolor** on change (green up / red down).
- Large aggregates formatted with separators (`$394,141,242.91`, `$1,370,495,231.74`).

## Spacing & density
Tight: ~4–8px row padding; book rows ~24px tall; the whole terminal optimizes for **rows and panels
per screen**. Hairlines (not whitespace) separate zones. This is the opposite end of the density
spectrum from hyperfoundation's spacious landing — same brand family, different job.

## Radii / elevation
Small radii (buttons/inputs ~6–8px; Privy modal 8/12/16/24). Flat surfaces; depth from
surface-color steps + hairlines + the order-book depth bars, not shadows. Overlays (announcements
popover, wallet modal) sit above with a subtle raise.

## Chart region
TradingView-style candlestick chart (canvas), left vertical **drawing-tool rail** (crosshair,
trendline, fib, text, measure, zoom, magnet, lock…), top toolbar (timeframe 5m/1h/D, Indicators,
settings, fullscreen), OHLC readout line, bottom range strip (5y/1y/6m/3m/1m/5d/1d), UTC clock, and
`log/auto` scale toggles.

## Figma-grade summary
```
Shell:        fixed viewport terminal, internal-scroll panels, 1px hairline splits
Ticket width: ~320px fixed; book ~300px; chart flexes
Type:         "OurFont", 400/500, ~11–14px, tabular-nums everywhere
Colors:       near-black surfaces · #D2DAD7 text · #1FA67D up · #ED7088 down · mint highlight
Radii:        6–8px controls
Density:      HIGH (CEX-grade); rows ~24px; hairline separation
Motion:       in-place live updates, value flashes; minimal transitions
```
