# 002 — Fix the global reduced-motion rule (keep the tint, freeze the loops)

- **Status**: TODO
- **Commit**: 4c0975f
- **Severity**: HIGH
- **Category**: Accessibility
- **Estimated scope**: 2 files (`globals.css`, comment in `Skeleton.tsx`), ~10 lines

## Problem

```css
/* apps/web/src/styles/globals.css:66-68 — current */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

Two defects:

(a) It nukes the price tick-flash. `.flash-up`/`.flash-down` (globals.css:50-53) are one-shot, **color-only** animations — exactly the comprehension-aiding, non-movement feedback reduced motion should KEEP (house law: "flash degrades to an instant color change, not nothing"). At 0.01ms the tint is invisible, so reduced-motion users get zero price-change feedback on the live tape.

(b) It lacks `animation-iteration-count: 1 !important`, so infinite animations (`.eq-bar` globals.css:58, Tailwind `animate-pulse` in `components/ui/Skeleton.tsx:5`, `components/ui/HaltBanner.tsx:34`, `features/how/sections/ProofFlowLazy.tsx:9-10`) become 0.01ms infinite loops sampled at arbitrary phase — they can flicker instead of freezing.

## Target

```css
/* target — apps/web/src/styles/globals.css */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  /* The tick tint is information, not motion (color-only, zero travel) — reduced motion keeps it. */
  .flash-up, .flash-down { animation-duration: 180ms !important; }
}
```

## Repo conventions to follow

- The correct per-element pattern already exists at `features/landing/LoopStage.tsx:72` (`animate-pulse … motion-reduce:animate-none`) — this plan fixes the global fallback everything else relies on.
- Comment style: short, law-citing (see globals.css:49-51).

## Steps

1. Edit `apps/web/src/styles/globals.css:66-68` to the Target block (add the iteration-count line and the flash exemption inside the same media query).
2. Update the stale claim at `globals.css:56` — the eq comment says "Reduced-motion freezes it via the global rule below"; after this fix that is true (loops complete once and stop). Leave the wording, it becomes accurate.
3. `components/ui/Skeleton.tsx:2` comment says "honors prefers-reduced-motion via globals.css" — also becomes accurate; no edit needed. Verify only.

## Boundaries

- Do NOT convert the global rule to per-component `motion-reduce:` utilities — the blanket rule is the house safety net.
- Do NOT touch the flash keyframes themselves (globals.css:50-53).
- If globals.css:66-68 differs from the excerpt, STOP and report.

## Verification

- **Mechanical**: `cd apps/web && npx tsc --noEmit` → exit 0 (CSS-only change; type-check is the repo's cheapest smoke).
- **Feel check**: DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`. On `/terminal`: a live price change still tints green/pink for a beat (was: nothing); the Booth equalizer bars and any skeletons are FROZEN, not flickering. On `/how-it-works`, the FAQ opens instantly.
- **Done when**: under reduced motion, the tape still gives color feedback and no infinite animation visibly runs.
