# SofaScore UX Research

A reverse-engineering of SofaScore's **product design system, interaction system, information
architecture, and component patterns** — not its code, markup, or assets.

**Method.** Live inspection of `sofascore.com` (July 2026, football in-season, WC26 knockouts
live) via an instrumented browser. Layout and hierarchy read from screenshots; tokens, spacing,
type, motion timings, and component anatomy extracted from *computed styles* (the rendered design
system, e.g. CSS custom properties), not from source files. No HTML/CSS/JS was copied and no
proprietary asset was downloaded.

**Goal.** Extract the *timeless principles* behind an experience that feels world-class, so we can
build **Ninety** — a premium live football trading exchange — with its own identity. The payload is
[`../NINETY-DESIGN-LAWS.md`](../NINETY-DESIGN-LAWS.md). Everything here is the evidence behind it.

## What SofaScore actually is (and how it differs from us)

A live-scores + stats product. Its "engagement" surfaces (crowdsourced **Who-will-win vote**,
crowdsourced **player ratings**, an opt-in **Odds** toggle) are *polls and reference data*, never a
market. Ninety is a **trading exchange** with a live price as the hero. So we borrow SofaScore's
**information density, live-data discipline, and depth-in-tabs IA** — and reject its ad-driven
layout and its passive, read-only stance. Where SofaScore shows a *number*, Ninety shows a
*price that moves and can be traded*.

## Contents

| File | What it covers |
|---|---|
| [`architecture.md`](architecture.md) | Information architecture, URL model, layout skeleton, data/live model |
| [`navigation.md`](navigation.md) | Global nav, sport switcher, in-page tabs, date stepper, wayfinding |
| [`design-system.md`](design-system.md) | The full token system (298 vars): colors, space, type, radii, z-index, motion |
| [`spacing.md`](spacing.md) | Spacing/sizing scale, rhythm, density decisions |
| [`typography.md`](typography.md) | Type families, scale, weights, numeric treatment |
| [`colors.md`](colors.md) | Palette, semantic color, the rating ramp, sport/state colors |
| [`motion.md`](motion.md) | Duration scale, easing, live flashes, transitions, sticky behavior |
| [`screens/home.md`](screens/home.md) | Scores home (3-zone scoreboard) |
| [`screens/match.md`](screens/match.md) | Match detail (the crown jewel) |
| [`screens/league.md`](screens/league.md) | Tournament/league (standings, fixtures) |
| [`screens/player.md`](screens/player.md) | Player profile (ratings, heatmap, attributes) |
| [`screens/team.md`](screens/team.md) | Team profile |
| [`screens/search.md`](screens/search.md) | Global search |
| [`screens/settings.md`](screens/settings.md) | Settings / preferences |
| [`screens/responsive.md`](screens/responsive.md) | Breakpoint behavior 390 → 1536 |
| `components/*` | Reusable primitives (match row, score header, timeline, rating badge, standings, tabs, filters, vote, data-viz, search) |

## The one-paragraph thesis

SofaScore feels premium because it is **quiet everywhere so it can be loud where it counts.**
A flat, near-monochrome shell (one blue, grey surfaces, three font weights) carries an enormous
amount of live numeric data without noise, and *color is spent only on meaning* — green/red for
momentum, a rating ramp for quality, red for live. Depth is achieved through **tabs and progressive
disclosure**, never through decoration. Motion is a strict 50–500ms token scale used for
information (a score flashes; it doesn't bounce). Every screen is the same skeleton re-parameterized,
so the product feels like one object. Ninety should inherit the discipline and move the boldness to
the **price and the Momentum River.**
