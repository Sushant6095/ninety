# trade — Responsive

A pro terminal is desktop-first; it degrades to a focused mobile trader, not a shrunken desktop.

## Desktop (≥ ~1280px)
Full 4-zone terminal: chart (flex) | order book/trades (~300px) | ticket (~320px) over the bottom
dock. Panels resizable. This is the intended experience.

## Laptop (~1024–1280px)
Columns tighten; the chart shrinks first; book + ticket hold their widths. Stat strip may wrap or
truncate labels. Bottom dock height reduces.

## Tablet (~768–1024px)
The three columns can't coexist comfortably → the app typically **tabs the panels**: Chart / Book /
Trade become switchable views, or book+ticket stack beside a smaller chart. Bottom dock becomes a
collapsible drawer.

## Mobile (< 768px)
Reorganizes into a **single-column, tabbed trader**:
- Sticky market header (pair, mark, 24h change).
- Primary view = **chart** or **ticket** via a tab/segmented switch.
- **Order book / trades** behind a tab or a bottom sheet.
- **Trade ticket** often a **bottom sheet / drawer** triggered by a Buy/Sell bar pinned to the
  bottom (thumb-reachable) — the classic mobile-DEX pattern.
- Positions/orders behind tabs or a sheet.
- A **bottom action bar** (Buy/Sell) is the mobile-native affordance.

## Density & type
Numbers stay tabular and legible; the app sheds columns/panels rather than shrinking text below
readability. Touch targets grow (≥44px) for order controls on mobile.

## Overflow discipline
Each panel scrolls internally; the page itself doesn't scroll horizontally. Long books/histories
virtualize.

## For Ninety
1. **Desktop-first terminal; mobile = tabbed single-column** with a pinned **Buy/Sell bottom bar**
   and the **ticket as a bottom sheet**.
2. Panelize (chart / book / ticket) into tabs on tablet.
3. Keep the **Momentum River + price** as the always-visible hero across breakpoints; everything
   else can hide behind tabs/sheets on small screens.
4. Grow touch targets; virtualize long lists.
