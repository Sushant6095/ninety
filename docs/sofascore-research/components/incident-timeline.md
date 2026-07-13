# Component — Incident Timeline (Match Events)

The vertical feed of what happened in a match, in minute order. One of SofaScore's most legible
inventions: a **center spine with home events left, away events right.**

## Anatomy
```
              ┌───────── center spine (minute axis) ─────────┐
 90'+9  ⚽ [▶]  D. Penha (assist J.S.R. Leandro)   2–0        │
 90'+6            🟥 W. Fernando (Foul)                        │
              [ Additional time 6 ]  ← inline period chip      │
        84'                              🟨 Foul  G. Henrique   │
        79'                              🔁 I. Fernandes ↔ …    │
 78'    🟨 J. Lucas (Time wasting)                             │
```
- **Home incidents left-aligned, away right-aligned**, around a central minute axis. Side = team,
  no legend needed.
- **Minute markers** at the edges (`90'+9`, `78'`).
- **Glyphs** encode type: ⚽ goal (with running score + often an inline **▶ video** affordance),
  🟨/🟥 cards, 🔁 substitution (in green / out muted), VAR, penalty, own-goal.
- **Period chips** inline (`HT`, `Additional time 6`, `FT`) break the feed into phases.

## Variants
- **All** vs **Key events** (sub-tab filter — trims to goals/cards/major only).
- **Live** (new incidents prepend/append as they happen, animated in).
- **Commentary** variant: richer text lines interleaved for major matches.

## States
- **Live:** newest incident animates in (~200ms); score chip updates; the list grows.
- **Finished:** complete, static, scannable.
- **Empty / lower-tier:** minimal or "no events recorded."

## Interaction
Player/assist names → player pages. Goal ▶ → inline video/highlight. Filter (All/Key events) trims
in place. The feed itself is scrollable within its rail.

## Motion
Incident enter ~200ms (fade/slide from the relevant side). No decorative motion; the *spatial side*
carries meaning so animation stays minimal.

## Spacing
Tight vertical rhythm; each incident ~one line; minute + glyph + name in a fixed micro-grid.
Alternating alignment does the visual separation (less need for dividers).

## Accessibility
Ordered list semantically; each item names team/minute/type/player
(`"78 minutes, yellow card, J. Lucas, Avaí"`). Live prepends via a polite live region. Video button
labeled.

## When to use
Any chronological event feed for a single contest.

## When NOT to use
For aggregate stats (use stat bars) or for cross-match feeds (use a list).

## Ninety translation
This is the model for a **live market event feed**: a center-spine timeline where **match events**
(goal, card, halt) sit alongside **market events** (big trade, price swing, halt/resume), minute-
stamped, streaming in live. Encode side/type with glyphs + color (up-green / down-pink / halt-amber)
so it's scannable at a glance. The alternating-spine idea maps to *match-event vs market-event*
columns.
