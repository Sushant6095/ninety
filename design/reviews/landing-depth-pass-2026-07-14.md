# design-cop verdict — `/` landing depth pass · 2026-07-14

Round 1: FAIL on 6 (two links missing active states) and 12 (LivePrice row absent; stale
EquityCurve/LoopStage rows) + 3 non-blocking raises (clamp hoisting, halt-on-hero-tape, 346px CLS pin).
All fixed in-session; round 2 re-verified every claim at file level.

**FINAL: PASS 12/12** — line 10 clears elevation ("beats the brief, not merely matches it").

| # | Criterion | Verdict |
|---|-----------|---------|
| 1 | Hierarchy | PASS — one hero (thesis + live River tape as one unit); one dominant element per section |
| 2 | Tokens | PASS — zero raw hex; display sizes hoisted to tokens.css vars → Tailwind steps text-hero/section/stat/number |
| 3 | Restraint | PASS — six sections, one job each; no football depth on the surface |
| 4 | Blend | PASS — full Polymarket spine in the hero (outcome → probability → chart → trade), Hyperliquid calm |
| 5 | Motion | PASS — all timings trace to motion.ts on the ninety ease; reduced-motion global + per-choreography; 346px pin closes CLS |
| 6 | States | PASS — every interactive element has hover/focus-visible/active; skeleton + store-cold fallbacks |
| 7 | A11y | PASS — rings, ≥44px targets, ≥4.5:1, axe 0 on / |
| 8 | Copy | PASS — sentence case, price·trade·credits, play-money twice, zero gambling vocabulary |
| 9 | Consistency | PASS — one container, board-literal FeaturedPanel, shared Footer/tokens |
| 10 | Elevation | PASS — SSOT-live hero tape; halt replays on every re-entry, legend ignites in sync, halt reaches the hero tape |
| 11 | Feeling | PASS — the amber HALTED wash over a real trading market, echoed above the fold |
| 12 | Provenance | PASS — LivePrice row (PriceChip lineage, searches logged), HeroRiver + replayNonce rows accurate |

Read-out-loud: hero tape and loop panel read ONE store — score/minute/price agree in every capture
(lg caught LIVE 1–0/61.0 on both; xl caught HALTED/61.4 on both). The 61.4 section is definitional.

Outstanding gate: **score.motion.dev** requires the deployed URL — re-run against ninety-nu.vercel.app
after this ships; current motion is transform/opacity/clip-path + one extra canvas chart (same class the
terminal carries at S). If the grade drops below S, fix the motion, do not ship the regression.
