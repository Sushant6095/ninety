# Component — Filters, Chips, Date Stepper, Toggle

The controls that scope a list without leaving it. On the scores home: scope tabs + state chips +
date stepper + odds toggle, all pinned under the header.

## Filter chips (state filter)
`Live (35) · Finished · Upcoming` — rounded chips; the active one gets a tinted fill (live = red
tint `status-live-highlight`), inactive are outline/ghost. **Count in the chip** (`Live (35)`) tells
you what you'll get before clicking.
- **States:** default (ghost) · active (tinted fill) · hover (wash) · focus (ring).
- **Interaction:** single-select scope; switches the list instantly (client-side), no reload.
- **Motion:** fill/text transition 150ms; the list cross-fades ~120ms.

## Date stepper
`‹ Today ›` — prev/next arrows around a label; "Today" is the reset anchor. Pages the whole list by
day. A calendar picker is typically available on the label.
- Keeps you oriented in time; the label shows the active day (relative "Today" or a date).

## Odds toggle
A switch (off by default) that **reveals an odds column** inline across match rows — additive, not a
mode change. Reflects the settings' odds format.
- **States:** off (default) · on · disabled (regions without odds).
- Off-by-default is a deliberate stance: odds are opt-in reference data, not core.

## Scope tabs
`All / Favourites / Competitions` — a primary tab set choosing *which* matches populate the list
(everything, your follows, or a competition browser).

## Shared behavior
- All apply **client-side, instantly** — the list re-renders in place; no navigation.
- They **stack and pin** (sticky z-98/99) under the global header while scrolling.
- Combinations compose (scope × state × day) predictably.

## Accessibility
Chips = toggle buttons or a radio group (`aria-pressed`/`role="radio"`); date arrows labeled
(`"previous day"`); toggle = a labeled switch (`role="switch"`, `aria-checked`). Announce result
count changes politely.

## When to use
Scoping a single dense list along a few orthogonal axes (state, time, scope). Fast, reversible,
non-destructive filtering.

## When NOT to use
For many simultaneous filters (use a filter panel/drawer) or for actions (chips imply *filtering*,
not *doing*).

## Ninety translation
Live tape / market list scoping: `In-play · Upcoming · Settled` state chips (with live counts), a
day/matchweek stepper, `All / Watchlist / Holdings` scope, and an additive toggle for advanced
columns (e.g. show 24h Δ / volume). Apply instantly, pin under the header, compose predictably.
