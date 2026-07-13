# Component — Tabs (the depth mechanism)

Tabs are how SofaScore fits an enormous amount per entity without navigation sprawl. Two register:
**primary** (underline) and **secondary/segmented** (pill/segmented control), often nested 2 deep.

## Variants
- **Primary tabs (underline):** the entity's top-level sections (Match: Details/Lineups/Statistics/
  Standings/H2H/Media). Active tab = colored label + sliding underline. Horizontally scrollable on
  narrow screens.
- **Segmented control (pill):** a bounded set of mutually exclusive views inside a section
  (`All / Home / Away`; `By date / By round`; incident `All / Key events`). A track with a moving
  active pill.
- **Count badges** on tabs where relevant (mirrors the nav's live counts).

## States
- **Active:** colored text + underline (primary) or filled pill (segmented).
- **Inactive:** muted (`n-lv2/3`).
- **Hover:** darken toward active.
- **Focus:** ring; arrow keys move between tabs.
- **Disabled/empty:** a tab with no data is dimmed or shows an empty panel (rarely hidden — keeps
  the set stable so muscle memory holds).

## Interaction
Click/tap or ←/→ to switch. Content cross-fades (~120–200ms); underline/pill slides. URL often
reflects the active tab (deep-linkable). Switching is instant (client-side) — users tab constantly.

## Motion
Underline/pill slide 150ms; content cross-fade 120–200ms. Snappy by design.

## Spacing
Primary tabs: comfortable horizontal padding, single row, scroll-overflow. Segmented: tight track,
equal-width or content-width segments.

## Accessibility
Proper `tablist` / `tab` (`aria-selected`) / `tabpanel` wiring; roving tabindex; ←/→ navigation;
panel labeled by its tab. Segmented controls behave as radio groups.

## When to use
- **Primary underline:** top-level sections of a single entity (peer views of the same subject).
- **Segmented:** a small, fixed set of view modes for one dataset.

## When NOT to use
- More than ~7 primary tabs (overflow to "More" like the sport nav, or reconsider IA).
- Tabs for *sequential* steps (that's a wizard) or for navigation to *different entities* (that's
  links/nav).
- Segmented control with >4–5 options (becomes a dropdown).

## Composition
Primary tabs host tab panels that themselves contain segmented controls (2-level nesting max).
Keeps depth without a labyrinth.

## Ninety translation
Market page primary tabs: **Trade · Order book · Trades · Chart · Rules**. Segmented sub-controls:
book depth (`All / Bids / Asks`), chart range (`1m / 15m / Match / All`), positions (`Open / Closed`).
Keep nesting ≤2, reflect active tab in the URL, cross-fade fast — traders switch views constantly.
