# 004 — Tokenize the stray motion literals (MomentHero, BracketB, LandingHero)

- **Status**: TODO
- **Commit**: 4c0975f
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens
- **Estimated scope**: 3 files, ~15 lines

## Problem

Three files hand-type values the token system already owns (or should own):

```tsx
/* apps/web/src/components/ui/MomentHero.tsx:91 — current */
transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
```
The bezier IS `motion.easeOut` inlined; 1.1s maps to no token — in a file whose own doc comment (line 16) claims "Tokens only".

```ts
/* apps/web/src/features/bracket/BracketB.tsx:153-157 — current (abridged) */
.from(r32,   { …, duration: 0.3,  stagger: 0.03 }, …)
.from(r16,   { …, duration: 0.35, stagger: 0.05 }, 0)
.from(qf,    { …, duration: 0.35, stagger: 0.05 }, …)
.from(sf,    { …, duration: 0.35 }, …)
.from(finale,{ …, duration: 0.4,  stagger: 0.08 }, …)
```
Five near-identical magic durations (0.3/0.35/0.35/0.35/0.4).

```ts
/* apps/web/src/features/landing/LandingHero.tsx:29-37 — current (the delays only) */
gsap.from("[data-hero-word]", { …, delay: 0.1 });
gsap.from("[data-hero-after]", { …, delay: 0.1 + word + stagger * 2 });
gsap.fromTo(line, …, { …, delay: 0.2, … });
```
The only untokenized values in an otherwise fully token-driven file.

## Target

- MomentHero: `import { motion as m } from "../../design/motion";` then `transition={{ duration: m.riverDraw / 1000, ease: m.easeOut }}` — the moment reveal is River-family choreography; 1.4s (riverDraw) replaces 1.1s. If the 300ms lengthening visibly drags in the feel check, instead ADD a token `momentReveal: 1100` to `design/motion.ts` (same comment style as `riverDraw`) and use that. Choose ONE; do not leave 1.1 inline.
- BracketB: hoist named locals at the top of the reveal-building function, derived from tokens:
  ```ts
  const D_ROUND = motion.slow / 1000 + 0.1;  // 0.35 — bracket round reveal
  const D_EDGE = motion.slow / 1000 + 0.05;  // 0.30 — the r32 fringe
  const D_FINALE = motion.slow / 1000 + 0.15; // 0.40 — the finale beat
  ```
  and replace the five literals. Staggers (0.03/0.05/0.08) stay literal — they're already in the sanctioned 30–80ms band and per-round intent.
- LandingHero: one named local `const lead = 0.1;` used by all three delays (`lead`, `lead + word + stagger * 2`, `lead * 2` for the river's 0.2).

## Repo conventions to follow

- `features/landing/LandingHero.tsx:26-28` is the exemplar: `const word = m.heroWord / 1000; const stagger = m.heroStagger / 1000;` — token in, seconds local, used everywhere.
- GSAP imports come from `../../lib/gsap`, never `"gsap"` (ADR-052).

## Steps

1. `MomentHero.tsx:91`: swap to token duration + `m.easeOut` per Target (add the import).
2. `BracketB.tsx`: add the three named locals; replace the five duration literals.
3. `LandingHero.tsx`: add `const lead = 0.1;` beside `word`/`stagger`; use it in all three delays.

## Boundaries

- Do NOT change any stagger value or timeline offset — durations/delays only.
- Do NOT touch `useHaltSequence.ts` (its two off-token literals carry deliberate `ponytail:` ceiling comments — settled).
- If line numbers have drifted, match on the code excerpts; if the code itself differs, STOP and report.

## Verification

- **Mechanical**: `cd apps/web && npx tsc --noEmit` → exit 0.
- **Feel check**: `/bracket` — round-reveal cadence unchanged at full speed (values are numerically identical). `/moments/<any-id>` — the hero reveal at 1.4s: watch once; if it drags, apply the `momentReveal: 1100` fallback in Target. `/` — hero words + river draw unchanged.
- **Done when**: grep `duration: 0\.|delay: 0\.` in the three files shows only named locals / token expressions (staggers exempt).
