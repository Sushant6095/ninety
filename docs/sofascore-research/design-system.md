# Design System (Tokens)

SofaScore ships a **token-driven design system** (built on Panda CSS — the root exposes a
`--made-with-panda: "🐼"` marker). Everything below was read from the rendered
`:root` custom properties — ~298 tokens. This is the skeleton the whole product hangs on. The
lesson for Ninety is not the values, it's the *shape*: a small, named, semantic scale that every
component consumes, so nothing is ever hardcoded.

## Token families observed

| Family | Count / range | Notes |
|---|---|---|
| `--colors-*` | ~180 | Overwhelmingly *semantic*, not raw palette (see below) |
| `--spacing-*` | 2px → 48px | Named steps `2xs…4xl` |
| `--sizes-*` | 2px → 112px | Named `2xs…12xl` — a parallel scale for component dimensions |
| `--font-sizes-*` | 0.625rem → 1.75rem | `2xs…2xl`, rem-based |
| `--radii-*` | 2px → 24px + 50% | `2xs…xl`, plus a circle token |
| `--durations-*` | 50ms → 500ms | `fastest…slowest` — the motion scale |
| `--z-index-*` | 0 → 1500 | Named stacking contract (see below) |
| `--breakpoints-*` | 480 → 1344px | `xs/sm/md/lg` |
| `--fonts-*` | 2 families | `Sofascore Sans`, `Sofascore Sans Condensed` |

### Key insight: color is *semantic-first*

The palette isn't `blue-500 / gray-200`. It is `--colors-home-away-home-primary`,
`--colors-status-live`, `--colors-rating-s80`, `--colors-player-position-goalkeeper`. Colors are
named by **meaning**, so a component references intent (`status-live`) and the value can change
centrally. There are dedicated ramps for: home/away, live/status, player rating, player position,
sport identity (tennis/cricket/motorsport/esports have their own sub-palettes), heatmap, and
playoff promotion/relegation. See [`colors.md`](colors.md).

## The scales (verbatim)

### Spacing (`--spacing-*`)
```
0    0px
2xs  2px
xs   4px
sm   8px
md   12px
lg   16px
xl   24px
2xl  32px
3xl  40px
4xl  48px
```
A ~1.4–1.5× geometric-ish step. Base rhythm unit is effectively **4px**, with 8/12/16 as the
workhorses. `md = 12px` (not 16) is the default gap — this is why the UI reads *dense but not
cramped*. See [`spacing.md`](spacing.md).

### Sizing (`--sizes-*`) — parallel to spacing, extends higher
```
2xs 2 · xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 2xl 32 · 3xl 40 · 4xl 48
· 5xl 56 · 6xl 64 · 7xl 72 · 8xl 80 · 9xl 88 · 10xl 96 · 11xl 104 · 12xl 112
```
Plus `min-content / max-content / fit-content / 100%`. Component heights (rows, avatars, badges)
pull from here, not from spacing — a subtle but disciplined split.

### Type sizes (`--font-sizes-*`)
```
2xs 0.625rem (10px)   xs 0.75rem (12px)   sm 0.875rem (14px)
md  1rem     (16px)   lg 1.125rem (18px)  xl 1.25rem  (20px)
2xl 1.75rem  (28px)
```
Only **7 sizes**, and the ceiling is 28px. There is no giant display type — the product is a data
surface, not a marketing page. See [`typography.md`](typography.md).

### Radii (`--radii-*`)
```
2xs 2 · xs 4 · sm 8 · md 12 · lg 16 · xl 24 · 50%
```
Cards land at `md`(12)/`lg`(16); chips/pills at `50%` or full; small inline badges at `xs`(4)/`sm`(8).

### Motion durations (`--durations-*`)
```
fastest 50ms · faster 100ms · fast 150ms · normal 200ms
· slow 300ms · slower 400ms · slowest 500ms
```
The entire product animates within **50–500ms**. Micro-feedback lives at 50–150; content
transitions at 200–300; nothing exceeds 500. See [`motion.md`](motion.md).

### Z-index contract (`--z-index-*`)
```
backdrop 0 · button 1 · dropdown 100 · fixed 101 · popover 102
· subheader 103 · header 104 · mobile-menu 105 · bottom-navigation 106
· floating-cta 107 · modal-backdrop 108 · modal 109 · modal-sticky 110
· alert 111 · mui 1500
(sticky 99 · sticky-secondary 98 · sticky-tertiary 97)
```
This is the most quietly impressive token family: a **named, exhaustive stacking order**. There is
never a `z-index: 9999` guess. Sticky layers sit *below* 100 (97–99); chrome sits 100–107; modals
108–111; a `1500` escape hatch for a 3rd-party (MUI). Ninety should copy this idea wholesale.

### Breakpoints (`--breakpoints-*`)
```
xs 480 · sm 768 · md 992 · lg 1344
```
Note `lg = 1344`, not 1280 — the desktop three-column layout needs the width. Below `md (992)` the
side rails collapse.

### Elevation
`--colors-elevation-elevation1/2/3` are all `rgba(34,34,38,0.16)` — i.e. **one shadow color**
(the ink at 16%), reused at three intents. Depth comes from *surface color steps*, not from a
shadow ramp. Cards are distinguished by being `#fff` on an `#edf1f6` page, not by heavy shadows.

## What to steal for Ninety

1. **Semantic color tokens** — name by meaning (`price-up`, `status-live`, `chain`), never by hue.
   Our `tokens.css` already does this; SofaScore validates going *further* (position, sport, rating
   ramps as first-class tokens).
2. **Two parallel scales** — `spacing` (gaps/padding) and `sizes` (component dimensions). Keeps row
   heights consistent independent of internal padding.
3. **A named z-index contract** — 97–111 with an escape hatch. No magic numbers.
4. **A 7-step type scale capped low** — data products don't need 60px headlines.
5. **One shadow color at low opacity** — depth via surface steps + hairlines, not drop shadows.
   (Matches our existing hairline `#232A33` approach.)
6. **A 50–500ms duration scale** with named intents — we already have `--duration-*`; ensure every
   animation pulls from it.
