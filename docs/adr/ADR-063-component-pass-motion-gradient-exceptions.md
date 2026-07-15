# ADR-063 — Component-pass motion & gradient exceptions (sanctioned, scoped)

Status: accepted 2026-07-15 (`merge/live-integration`). Cross-ref: ADR-052/058/059 (animation law,
landing dynamism), design/verdicts/2026-07-15-component-pass.md (the FAIL that forced this ADR),
design/PROVENANCE.md "Component pass" rows (where each tension was first flagged).

## Context

The MagicUI + Skiper + GodUI + SVAR component pass was user-ordered with explicit placements. Three
pulled components carry an essence that collides with standing design law: two motion rules
(transform/opacity-only; no idle/infinite animation near live prices) and the no-decorative-gradient
rule. design-cop correctly failed the pass because the tensions were flagged in PROVENANCE but never
ADR'd. The prompt is the spec (law #0) — so the exceptions are sanctioned HERE, each with a hard
scope, instead of silently shipping.

## Decision — three named exceptions, nothing broader

1. **Board live-ticker marquee** (`vendor/magicui/marquee.tsx` → `home/Ticker.tsx`): a continuous
   60s linear CSS loop IS the ticker idiom — it carries live prices, so it is information, not
   idle decoration. Constraints: CSS keyframes only (compositor; the `--marquee-*` vars can never
   bind the 200ms motion token), `pauseOnHover`, clones `aria-hidden` + `inert`,
   `prefers-reduced-motion` → static overflow row. The LivePrice 180ms tick-flash inside cells is
   untouched. This exception covers the ticker strip ONLY — no other infinite loop is sanctioned on
   a live-price surface.
2. **Landing pillars hover-expand** (`vendor/skiper/skiper52.tsx`): the expansion animates
   `flex-grow` — a layout property, normally banned. Sanctioned for THIS one marketing row only:
   three panels, no live prices within the section, hover AND focus-within, reduced-motion → equal
   widths with no transition. Any second use of layout-property animation needs its own ADR.
3. **Token-mixed gradient effects where the gradient IS the ordered component's essence**:
   magic-card pointer spotlight (board info cards), the static backlight hero glow, and the
   holographic Moment-card foil. Constraints: every stop is a `color-mix()` of Ninety token vars
   (zero raw hex), hover/pointer-gated where interactive, static (or absent) under
   `prefers-reduced-motion` and on touch, and none may sit on the terminal tape. The blanket
   no-decorative-gradient rule stands everywhere else.

## Also decided this pass (MotionScore gate enforcement)

- The live audit measured desktop thrashing C→D after the pass; the two NEW per-frame scroll-JS
  pieces were cut per the gate: **skiper19 PricePath removed from the landing tree** (component
  kept in `features/landing/PricePath.tsx`, one import re-adds it) and **the velocity band
  rewritten from scroll-velocity JS to the CSS marquee keyframes** (visual kept, zero scroll reads,
  the vendor's static `will-change-transform` row no longer mounts). GPU pressure stayed A-tier —
  the IO-gating discipline on every canvas piece did its job.

## Consequences

- design-cop judges these three exceptions as PASS when their constraints hold, FAIL on any drift
  (a new infinite loop, a second layout animation, a gradient outside the three named homes).
- If a future MotionScore run shows the ticker or pillars row in a thrashing/GPU finding, the
  exception dies and the component is cut — the gate outranks the exception.
