# Spacing & Density

## The two scales

SofaScore runs **two parallel scales** (see [`design-system.md`](design-system.md)):

- `--spacing-*` (0 → 48px) for **gaps and padding**
- `--sizes-*` (2 → 112px) for **component dimensions** (row heights, avatars, badges, icons)

Keeping them separate means row *heights* stay consistent even when internal *padding* is tuned per
component. A match row is a fixed `size` tall; its padding is a `spacing` token; changing one never
disturbs the other.

## Spacing steps (the rhythm)

```
2xs 2  ·  xs 4  ·  sm 8  ·  md 12  ·  lg 16  ·  xl 24  ·  2xl 32  ·  3xl 40  ·  4xl 48
```

Base unit is **4px**. Observed usage:

| Step | Where it shows up |
|---|---|
| `2xs 2` / `xs 4` | Icon-to-label gaps, badge inner padding, hairline offsets |
| `sm 8` | Chip padding, gap between crest and team name |
| `md 12` | **Default gap** — between rows, between a label and its value |
| `lg 16` | Card inner padding, gap between grouped sections |
| `xl 24` | Gap between major cards, column gutters |
| `2xl 32 – 4xl 48` | Section separation, page-level vertical rhythm |

**Why it reads dense-but-calm:** the default gap is **12px, not 16**. SofaScore consciously runs one
notch tighter than a typical marketing site. Combined with 14px body text and short row heights, you
get *many rows per screen* (the point of a scores product) without feeling cramped, because the
*hairlines and surface steps* do the separating that whitespace would otherwise do.

## Density philosophy

- **Rows over cards for lists.** The match list, standings, and stats are dense rows separated by
  1px hairlines (`neutrals-n-lv4`), not cards with padding. Cards are reserved for *featured/heavy*
  content (the vote widget, team-of-the-week, a single highlighted match).
- **Progressive density.** Collapsed league accordions are ultra-dense (a header + count); expanding
  reveals slightly airier match rows. Density is *earned by interaction*.
- **Alignment is the grid.** Numbers right-align in fixed columns; crests/labels left-align. The eye
  scans a clean vertical rule of scores. Tabular figures keep columns from jittering.

## Column / layout metrics (desktop, 1440px)

- Header sticky stack: **160px** tall (ticker + logo/search + sport nav).
- Three zones: left match-list rail (~570px) · center detail (~530px) · right ad/widget rail
  (~300px). Center is the "detail canvas" that changes per selection.
- Below `md (992px)` the rails collapse to a single stacked column (see
  [`screens/responsive.md`](screens/responsive.md)).

## Takeaways for Ninety

1. **Adopt the two-scale split** (`spacing` for gaps, `sizes` for dimensions) if we want row-height
   stability across a dense exchange UI (order book, trades, leaderboard).
2. **Default gap 12px, base unit 4px.** Run one notch tighter than a marketing site — a trading
   surface is a data surface. Let hairlines and surface steps carry separation.
3. **Rows for the live tape / book / trades; cards for the hero (price + Momentum River).** Match
   SofaScore's "dense rows, reserved cards" split.
4. **Right-align every number in a fixed column** with tabular figures. Non-negotiable for prices.
