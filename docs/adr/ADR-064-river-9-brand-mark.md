# ADR-064 — The River-9 brand mark

Status: accepted 2026-07-16 (`merge/live-integration`, shipped in `b30bc55`). Cross-ref: ADR-049
(design system), ADR-052/058 (the Momentum River as the signature element), ADR-055 (baked assets,
no runtime CDNs).

## Context

Ninety had a wordmark but no mark — nothing to put in a favicon, an OG card, or a header lockup
that survives at 16px. Every candidate had to come from the product's own iconography (the law
against template-brand decoration), work in the dark chrome, and ship with zero font dependency.

## Decision

The mark is the **River-9**: a geometric "9" whose tail is a momentum line — it drops, then kicks
up in up-green (the goal-cliff). One glyph that reads three ways: the numeral (Ninety / 90
minutes), a market tick-up, and the Momentum River itself compressed to its signature beat.

- **Construction**: pure SVG paths (circle head + stem + rising tail), no font. The identical
  geometry ships as `Logomark.tsx` (React) and `public/favicon.svg` (standalone).
- **Color law**: head + stem take `currentColor` (the parent sets ink, normally `text-hi`); the
  rising tail is `var(--up)` — the semantic price-up token, NOT a decorative accent. A `mono` prop
  folds the tail into the ink for footer/monochrome contexts. The favicon inlines the brand hex by
  necessity (a standalone SVG cannot reach tokens.css) on a dark tile so the glyph survives both
  light and dark browser chrome — this is the same sanctioned-hex-home class as tokens.css itself.
- **Lockup**: mark + Archivo wordmark in the app header (`TerminalHeader`), mark alone at small
  sizes (favicon, OG corner).

## Consequences

- The up-green tail means the mark carries semantic weight: it must never be re-tinted with a
  non-token color, and the mono variant is the only sanctioned desaturation.
- Any future brand surface (app icon, social avatars, print) derives from this geometry — no
  second mark.
