# Component — Rating Badge (+ the Rating Ramp)

SofaScore's signature data element: a small pill showing a **one-decimal rating** whose **color
encodes quality** via a dedicated ramp. It appears on every player, everywhere — lineups, subs,
timelines, player pages, team-of-the-week.

## Anatomy
A compact rounded rect (radius `xs–sm`, 4–8px), tight padding, containing a `N.N` number in bold.
The **background/text color comes from the rating ramp**, not a fixed accent:

```
--colors-rating-  s00 #A4A9B3 grey    (no rating)
                  s10 #DC0C00 red        ≤ ~5.9  poor
                  s60 #ED7E07 orange     ~ 6.0   below par
                  s65 #D9AF00 gold       ~ 6.5
                  s70 #00C424 green      ~ 7.0   good
                  s80 #00ADC4 cyan       ~ 8.0   very good
                  s90 #374DF5 blue       ~ 9.0+  exceptional
```
The ramp climbs grey → red → orange → gold → green → cyan → **blue** (= brand color at the top). It
is deliberately *not* a linear green→red; the perceptual jumps make adjacent grades distinguishable
(8.4 cyan vs 9.1 blue vs 7.1 green all read differently at a glance).

## Variants
- **Size:** large (player page hero rating, ~20px+ text) · medium (lineup) · small (14px, sub rows).
- **Emphasis:** solid fill (primary display) vs tinted/outline (secondary contexts).
- **"—" / grey** when no rating yet (pre-match, DNP).
- **Best-player highlight:** the top rating in a match gets extra prominence (spotlight card).

## States
- **Live:** rating updates during the match; value + color shift as performance changes (a living
  badge — high craft).
- **Final:** settles at FT.
- **Empty:** grey `s00` placeholder.

## Interaction
Usually non-interactive (a readout), but sits inside interactive rows (player row → player page).
Hover can reveal the rating breakdown/tooltip on richer surfaces.

## Motion
On live update, a brief flash/scale (~150ms) draws the eye to the change, then settles. Color
transitions within the duration scale.

## Spacing
Minimal internal padding (`2xs–xs`), fixed size from the `sizes` scale so a column of badges aligns.
Tabular figure keeps `10.0` and `6.4` the same width.

## Accessibility
Not color-only: the **number itself carries the meaning**, so colorblind users still read `9.1`.
Color is redundant reinforcement, not the sole signal — the correct pattern. Accessible name like
`"rating 7.9 out of 10"`.

## When to use
Any bounded quality/score on a fixed scale where you want instant good/bad reading *and* the exact
value.

## When NOT to use
For unbounded quantities (counts, money) — a ramp implies a fixed scale. Don't overuse the top
(blue) color or it stops signaling "exceptional."

## Ninety translation
The rating ramp is our most transferable steal. Build a **data-encoding ramp** for a bounded metric
— e.g. a trader **accuracy/win-rate badge**, or **market confidence / implied-probability** — where
color = magnitude and the number is always present (never color-only). Keep our up/down/halt/chain
accents as a *scale* (intensity of move → intensity of color) rather than four flat hues. Always
show the number; color is reinforcement.
