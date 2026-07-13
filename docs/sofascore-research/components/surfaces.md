# Component — Surfaces, Cards & Elevation

How SofaScore builds depth *without* heavy shadows or glassmorphism — the discipline behind the
"flat but layered" feel.

## The surface ramp (light mode)
```
surface-s0  #edf1f6            page background (cool grey)
surface-s1  #ffffff            card / panel (the workspace)
surface-s2  rgba(229,233,239,.5)  recessed / secondary fill
surface-t   #222226            INVERTED spotlight surface (dark card in light UI)
```
Depth = **surface color steps + 1px hairlines**, not a shadow ramp. All three
`--colors-elevation-*` tokens are the *same* `rgba(34,34,38,0.16)` — one shadow color, low opacity,
used sparingly. A card reads as elevated because it's **white on cool-grey**, edged by a hairline —
cheaper, calmer, and sharper than drop shadows.

## Card
- **Radius:** `md`(12) / `lg`(16). **Padding:** `lg`(16). Hairline or faint shadow edge.
- **Use:** featured/heavy content that deserves promotion out of the dense row lists — the vote
  widget, team-of-the-week, a single highlighted match, editorial. *Not* for list items (those are
  hairline-separated rows).

## Spotlight (inverted) surface
`surface-t #222226` — a **dark card inside the light product**, used for hero/engagement content
(team-of-the-week, featured event). A confident, deliberate contrast that pulls the eye without
adding a new color. High-craft move: invert the surface to create focus, don't add decoration.

## Section vs card
- **Sections** = flat runs on the page background separated by whitespace/hairlines (the dense
  lists, tables).
- **Cards** = promoted content lifted onto `s1`/`surface-t`.
The rule: *content that scans in bulk stays flat; content that deserves a look gets a card.*

## Ad slots (documented, mostly to reject)
The right rail and inline banners are ad surfaces, visually walled off with an "Advertisement" label
and often the only place with imagery/gradients. They are the *least* premium part of the page and
exist for monetization, not UX. **Ninety replaces this rail with live market data** (book /
positions / tape) — the anti-pattern to learn from: don't let a monetization rail flatten the value
of your best real estate.

## Hairlines & dividers
`neutrals-n-lv4 rgba(34,34,38,.15)` (and lighter `n-lv5 .06`) do most of the separation work — 1px
rules between rows, around cards, under headers. This is why the UI can be dense yet legible.

## Ninety translation (dark-first)
Invert the ramp: our tokens are `bg #0B0D10 → surface #14171C → hairline #232A33`. Same philosophy —
**depth via surface steps + hairlines, one low-opacity shadow at most, no gradients/glass** (already
our design law). Use a *lighter/elevated* surface (or a subtle glow strictly on the Momentum River)
as the "spotlight," mirroring SofaScore's inverted spotlight card — boldness concentrated on the one
signature element, everything else quiet.
