# Component — Match List (League Accordion + Match Row)

The single most reused pattern in the product. It appears on home, league, team, and search-result
screens, always identical, so users learn it once.

## Composition
```
League accordion group
 ├─ Header:  [crest] League name          [count badge] [chevron ▾]
 │           [flag]  Country
 └─ Match rows (when expanded):
      [time / status] [home crest] Home team [cards]  [home score] [★]
                      [away crest] Away team [cards]  [away score]
```

## Match Row anatomy
| Slot | Content | Treatment |
|---|---|---|
| Status | `00:30`, `FT`, `78'`, `Postpon…`, `HT` | 10–12px, muted; **live minute in red** `#cb1818` |
| Teams | home over away, crest + name | winner/leader `700`, other `400 @70%`; condensed font for long names |
| Incidents | red-card / yellow-card mini glyphs inline | position-adjacent to team |
| Score | `2 / 0` stacked, right-aligned | tabular; **flashes on change**; leader bolder |
| Favourite | ★ toggle | outline→filled; appears on hover, persists if set |

## Variants
- **Live** (red minute + subtle pulse + often a live-tinted background wash `status-live-highlight`)
- **Upcoming** (kickoff time, no score, optional odds column when Odds toggle on)
- **Finished** (`FT`, final score, dimmed slightly vs live)
- **Postponed / cancelled** (status text replaces score)
- **With odds** (3 odds chips appended: 1 / X / 2) — only when the global Odds toggle is on

## States
- **Hover:** faint `neutral-highlight #e8ecf3` wash across the row; ★ + chevron darken.
- **Focus:** visible focus ring (keyboard).
- **Selected/active** (when it's the open match): persistent highlight.
- **Loading:** skeleton row of the same height (no layout shift).

## Interaction
Whole row → match page. Inner crest/name → team page. ★ → toggle favourite (optimistic, persists).
Accordion header → expand/collapse group (~200ms, chevron rotates).

## Motion
Score flash ~180ms; live pulse; accordion 200ms; hover wash 100ms. All within the duration scale.

## Spacing
Dense: ~`sm–md` (8–12px) vertical padding, rows separated by 1px hairline (`neutrals-n-lv4`), not by
gaps. Fixed row height from the `sizes` scale keeps columns aligned.

## Accessibility
Row is a link with an accessible name (`"Avaí vs Náutico, 2–0, full time"`). ★ is a labeled toggle
button (`aria-pressed`). Accordion header is a button (`aria-expanded`). Live updates should use a
polite live region so screen readers hear score changes without focus theft.

## When to use
Any list of matches/fixtures, grouped by competition. The default way to show "many matches."

## When NOT to use
For a *single* highlighted match (use the featured card) or for the match you're currently viewing
(use the score header). Don't use the dense row where a match needs promotion/marketing weight.

## Composition with others
Groups under an [accordion](filters-and-chips.md); rows host [rating badges](rating-badge.md) (in
some contexts) and odds chips; the same row is filtered by [filter chips](filters-and-chips.md) and
paged by the date stepper.

## Ninety translation
This becomes the **market row / fixtures row**: `[kickoff/live minute] [home] v [away] [live price ↑↓]
[24h Δ] [watch ★]`. The score column → the **live price** (flashing up/down); odds chips → **quick
buy/sell** affordances; the ★ → watchlist. One row primitive across home, competition, team, and
search.
