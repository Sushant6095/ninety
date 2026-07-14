# 009 — Lift desktop Thrashing C (MotionScore)

- **Status**: TODO
- **Commit**: f6017d6
- **Severity**: MEDIUM (grade gate — overall B is held back by this one subscore)
- **Category**: Performance
- **Estimated scope**: 3–4 files, exploratory

## Problem

MotionScore (fresh local audits 2026-07-15, results `6dafe3f2…` and `ece288d6…`): overall **B (75/100)**, Desktop B with **Thrashing C** — while Mobile is A with Thrashing **S**. Desktop findings: [HIGH] "JS scroll-linked animations — use ScrollTimeline/ViewTimeline to avoid per-frame DOM reads" (×2, 5 scroll listeners detected), [HIGH] "Frame thrashing — batch DOM reads before writes" (max concurrent rAF: 4). The scoped will-change pass (hero draw, halt targets) improved mobile but not desktop.

Suspected contributors, in order:
1. GSAP ScrollTrigger's scroll listeners (LandingScroll arrivals + PriceScrub) — per-frame reads on desktop where all sections mount.
2. Four concurrent rAF loops: GSAP ticker, framer-motion, lightweight-charts, ScrollTrigger.
3. Per-frame `textContent` writes during counters (NumberTicker, PriceScrub, useHaltSequence's spread label) — text writes trigger layout.

## Target

Desktop Thrashing ≥ B without breaking ADR-052 (GSAP owns scroll choreography). Candidate moves, cheapest first — measure after each with `npx motionscore https://ninety-nu.vercel.app/?v=N`:
1. `ScrollTrigger.config({ ignoreMobileResize: true })` and consolidate the per-section triggers in LandingScroll into ONE `ScrollTrigger.batch()` (one listener, batched callbacks).
2. Make the counters write in a rAF-aligned single pass (GSAP `onUpdate` already is; ensure no interleaved reads — remove any `getBoundingClientRect`/measure inside update loops).
3. If still C: native CSS `animation-timeline: view()` for the simple section arrivals (keeping GSAP only for the hero + halt), behind an ADR amendment — this is the ScrollTimeline migration MotionScore recommends.

## Boundaries

- Do NOT add a new animation library. Do NOT touch the halt sequence's beats.
- Every step re-measured; stop at ≥ B.

## Verification

- **Mechanical**: `npx motionscore <prod-url>?v=N` → Desktop Thrashing ≥ B, no subscore regression.
- **Feel check**: landing scroll arrivals and the halt replay look identical at full speed.
