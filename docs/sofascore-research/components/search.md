# Component — Global Search

> The input is observed on every page (header, ~510px, placeholder "Search matches, competitions,
> teams, players, and more"). Overlay behavior below is documented from that affordance + standard
> SofaScore behavior; (~) marks details not independently re-measured.

## Anatomy
- **Input:** header-centered, wide, with a leading magnifier icon and placeholder naming the
  searchable entity types. On white, no visible border — reads as a search *field*, not a button.
- **Results panel (~):** opens below/over the header; grouped result rows under section headers.
- **Result row:** crest/icon · name · disambiguating subtitle (country / league / role) · entity
  type tag.

## Variants / states
- **Idle (empty):** recent searches + trending/suggested entities (never blank).
- **Typing / loading:** debounced (~200–300ms); shimmer or spinner; prior results dim.
- **Results:** grouped **Teams · Players · Tournaments · (Managers)**, ranked (exact/popular first).
- **No results:** explicit "no matches for …".

## Interaction
Focus opens the panel. Type → live grouped results. ↑/↓ moves selection, Enter opens, Esc closes and
returns focus to the input. Selecting navigates to the entity. Fastest path to anything in the
product.

## Motion
Panel open ~150–200ms; result rows fade/stagger subtly; no slow transitions.

## Spacing
Roomy result rows (crest + two lines) for scannability — more generous than the dense match list,
because you're *choosing*, not *scanning many*.

## Accessibility
Combobox pattern: `role="combobox"` input + `listbox` results, `aria-activedescendant` for the
highlighted row, full keyboard nav, focus management on open/close, announced result counts. Not
color-only.

## When to use
The universal entity finder — permanent, central, keyboard-first. One search for the whole product.

## When NOT to use
For filtering an on-screen list (use chips/filters). Search *navigates*; filters *scope*.

## Composition
Feeds every entity page; the result row is a lighter cousin of the match/player row primitive.

## Ninety translation
Global search across **matches · markets · teams · players · traders**, grouped + crest-rich +
keyboard-first, with a non-empty idle state (trending markets, your watchlist). Permanent header
real estate on desktop — it's the front door to the exchange.
