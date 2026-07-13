# Colors

All values below are from the rendered token layer. The headline: **SofaScore is light-mode by
default**, near-monochrome for chrome, and spends saturated color *only on meaning*.

## Base / surface (light mode is the default)

| Token | Value | Role |
|---|---|---|
| `surface-s0` | `#edf1f6` | Page background (cool light grey) |
| `surface-s1` | `#ffffff` | Card / panel surface |
| `surface-s2` | `rgba(229,233,239,0.5)` | Recessed / secondary surface |
| `surface-t` | `#222226` | **Inverted** spotlight surface (dark cards in light UI) |
| `neutrals-n-lv1` | `#222226` | Primary ink |
| `neutrals-n-lv2` | `rgba(34,34,38,0.7)` | Secondary text |
| `neutrals-n-lv3` | `rgba(34,34,38,0.45)` | Tertiary/muted text |
| `neutrals-n-lv4` | `rgba(34,34,38,0.15)` | Hairline / divider |
| `neutrals-n-lv5` | `rgba(34,34,38,0.06)` | Faint fill / hover wash |
| `neutral-highlight` | `#e8ecf3` | Hover/selected row wash |

**Pattern worth stealing:** the text/divider ramp is *one ink color at five opacities*
(`#222226` @ 100/70/45/15/6%), not five separate greys. Guarantees harmony and auto-adapts if the
ink hue ever changes. (Ninety's dark theme should do the mirror: one near-white at descending
opacities.)

## Brand / action

| Token | Value | Role |
|---|---|---|
| `primary-default` / `action-primary-default` | `#374df5` | Brand indigo-blue; primary buttons, links, header |
| `primary-variant` / `header-variant` | `#2c3ec4` | Darker blue; header bg, pressed states |
| `primary-highlight` | `rgba(55,77,245,0.15)` | Tinted fill behind primary elements |

One brand color, one darker variant, one 15%-tint. That's the entire brand-color story. Everything
else is semantic.

## Semantic / state (this is the real system)

### Home vs Away (the football duality)
| Token | Value |
|---|---|
| `home-away-home-primary` | `#0BB32A` (green) |
| `home-away-away-primary` | `#374DF5` (blue) |
| `home-away-*-variant` | darker pair (`#08861F` / `#2C3EC4`) |
| `home-away-*-highlight` | 25% tints |

Home is always green, away always blue — a **consistent spatial-color code** across momentum bars,
possession, shotmaps, lineups. The user never re-learns which side is which.

### Status / live
| Token | Value | Role |
|---|---|---|
| `status-live` | `#cb1818` (red) | Live match, live minute |
| `status-live-highlight` | `rgba(203,24,24,0.1)` | Live row wash |
| `status-crowdsourcing-live` | `#FF109F` (magenta) | Crowd-sourced live input |
| `status-success` / `sentiment-positive` | `#15b168` / `#0bb32a` | Up / good |
| `status-sentiment-negative` | `#cb1818` | Down / bad |
| `status-sentiment-medium` | `#d9af00` (amber) | Neutral / caution |
| `status-error` | `#c7361f` · `status-alert` `#c7921f` | Error / warn |

### The rating ramp (`--colors-rating-*`) — signature
A continuous quality scale mapped to color, used on every player rating badge:
```
s00 #A4A9B3  grey       (no rating yet)
s10 #DC0C00  red        ~ ≤ 5.9   poor
s60 #ED7E07  orange     ~ 6.0     below par
s65 #D9AF00  gold       ~ 6.5
s70 #00C424  green      ~ 7.0     good
s80 #00ADC4  cyan       ~ 8.0     very good
s90 #374DF5  blue       ~ 9.0+    exceptional (= brand blue)
```
The ramp is **not** a simple green→red; it climbs grey → red → orange → gold → green → cyan → blue,
so an 8.4 (cyan) reads visibly distinct from a 7.1 (green) and a 9.1 (blue). This is a
domain-specific *data-encoding palette*, the single most transferable idea for Ninety.

### Player position
`goalkeeper #E59C03` (amber) · `defender #374DF5` (blue) · `midfield #0BB32A` (green) ·
`forward #CB1818` (red). Consistent everywhere a position is shown.

### Sport identity ramps
Tennis, cricket, motorsport (per-series: F1 `#DC351E`, MotoGP, NASCAR `#007AC2`…), esports
(CS/LoL/Dota2), baseball pitch types, MMA red/blue corners — each sport carries its own sub-palette
so the product feels native per sport without a re-skin.

### Heatmap ramp (`--colors-heatmap-hm_1..5`)
`#cbedbf → #d5eb86 → #fffc20 → #ff8111 → #ff1f1f` (pale green → yellow → orange → red). Used for
player position heatmaps.

## Overlays
`overlay-darken1/2/3 = rgba(0,0,0, 0.25 / 0.5 / 0.65)` — three scrim strengths for modals/sheets.

## Takeaways for Ninety

- **Chrome is monochrome; color = information.** One brand hue, a five-opacity ink ramp, and then
  *every other color earns its place by meaning*. This is exactly our design law ("color used
  semantically, not decoratively") — SofaScore proves how far it scales.
- **Build a data-encoding ramp for price/quality**, the way SofaScore built the rating ramp. Ours
  is up `#2BD97C` / down `#FF3D81` / halt `#FFB020` / chain `#9D6BFF` — treat these as a *scale*,
  not four flat accents (e.g. intensity of a move → intensity of green).
- **Spatial color constancy:** pick a fixed color for each recurring duality (yes/no, buy/sell,
  home/away) and never swap it. SofaScore's home=green/away=blue never wavers.
- We (Ninety) are **dark-first** where SofaScore is light-first — invert the surface ramp, keep the
  semantic discipline identical.
