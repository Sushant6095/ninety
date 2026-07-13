# Screen — Global Search

> The search *input* is permanently present in the header (observed on every page, placeholder
> "Search matches, competitions, teams, players, and more", ~510px wide). The *results overlay*
> behavior below is documented from that affordance + standard SofaScore behavior; parts not
> re-measured live are marked (~).

## Purpose & primary goal
The universal jump-to. Goal: **reach any entity in one or two keystrokes** — team, player, league,
match, manager.

## Placement & trigger
Always-visible input in the header center (desktop). Focusing it opens a results panel below/over
the header. On mobile the input persists in the collapsed 96px header.

## Behavior (~)
- **Empty state:** recent searches + trending/suggested entities (so the panel is never blank).
- **On type:** debounced query (~200–300ms) hits a search API; results stream in.
- **Grouped results:** by entity type — **Teams · Players · Tournaments · (Managers)** — each with
  an icon/crest, name, and a disambiguating subtitle (country / league / role).
- **Keyboard:** ↑/↓ to move through results, Enter to open, Esc to close. (A well-behaved combobox.)
- Selecting navigates to that entity page.

## Component inventory
- Search input (see [`../components/search.md`](../components/search.md))
- Result rows grouped under section headers
- Empty/recent/trending state
- Loading (subtle inline spinner or shimmer rows)

## States
- **Idle/empty:** recent + trending.
- **Typing/loading:** shimmer or spinner; previous results dim.
- **Results:** grouped, ranked (exact/popular first).
- **No results:** clear "no matches for …" message.

## Motion
Panel opens ~150–200ms; result rows fade/stagger subtly; nothing slow.

## Accessibility
Combobox pattern (`role="combobox"` + listbox results), full keyboard nav, focus trapped in the open
panel, Esc closes and returns focus to the input.

## Premium signals
- **Permanent, wide, central** search = the product treats "find anything" as a first-class action,
  not a hidden utility.
- Grouped, crest-rich results make disambiguation instant (two players named "Silva" separated by
  club badge).

## Lesson for Ninety
Global search should span **matches · markets · teams · players · traders**, grouped, crest-rich,
keyboard-first, with a non-empty idle state (trending markets / your watchlist). It's the fastest
route into the exchange — give it permanent header real estate on desktop.
