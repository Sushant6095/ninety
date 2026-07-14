# design-cop verdict — terminal craft pass · 2026-07-15 (judged on the LIVE production deploy)

Scope: CompetitionsRail → market screener (hyperscreener.asxn.xyz structure, Ninety tokens, zero copied
markup) · app-level tooltip system (skip-delay + origin-aware entrance) · one press vocabulary
(active:scale-[0.97] across the trade path) · River ghost-pane guard · MotionScore re-audit.

Round 1: **NO-SHIP** — 7 (rail pills ~22px, no `hit`; footer link 33px) and 12 (screener row declared
"registries n/a" instead of logging real searches). Both fixed same session; round 2 re-verified at
file level.

**FINAL: SHIP — 12/12 PASS**, line 10 "beats the reference, not matches it."

| # | Criterion | Verdict |
|---|-----------|---------|
| 1 | Hierarchy | PASS — River owns ~46–49% of the fold; the denser rail stays quieter (lo ink, label-free cells) |
| 2 | Tokens | PASS — zero raw hex; .pop-content on var(--duration-fast)/var(--ease-out); mono one-decimal prices |
| 3 | Restraint | PASS — depth stays in MatchTabs; the rail carries markets, no tabbable depth |
| 4 | Blend | PASS — Polymarket spine center; Hyperliquid-density watchlist left; Sofascore in tabs |
| 5 | Motion | PASS — popIn opacity+scale 150ms on delayed-open only (instant-open unanimated per emil); transform-only presses; reduced-motion clamped |
| 6 | States | PASS — hover/focus-visible/active + aria-pressed/current; per-filter empty states; "Trading paused" verified halted |
| 7 | A11y | PASS (round 2) — `hit` pills, min-h-11 footer link + submit; axe 0 on / and /terminal |
| 8 | Copy | PASS — price/trade/credits; "odds" only as the upstream TxLINE path |
| 9 | Consistency | PASS — one shell verbatim across live lg/xl and local stills |
| 10 | Elevation | PASS, beats — column header, live-count pills, lead-cell tint, empty states; app-wide instant-repeat tooltips |
| 11 | Feeling | PASS — one goal lands everywhere in a single beat (River cliff, Booth 31→55, ticker/rail/cells, +810 in positions) |
| 12 | Provenance | PASS (round 2) — row 34 logs the real rejected candidates (21st id-9045/id-5917, shadcn TanStack tables, magicui) |

Read-out-loud (live-terminal.xl, mid-goal): ticker = rail = market cells = River tags = Booth (31→55);
open-positions math exact on both stills (e.g. (54.5−41.0)×60 = +810). One store, verified on production.

## MotionScore (npx motionscore, local audits on the live deploy)
- Fresh ?v=3 and ?v=4 (post will-change pass): **Overall B (75/100)** — Desktop B (Animations A ·
  Scroll A · GPU A · **Thrashing C**), Mobile A (Animations S · **Thrashing S** ↑ from A · GPU A).
- vs the 07-14 cached grade (B / Thrashing C): **no regression; mobile thrashing improved to S; the
  desktop thrash fix is NOT yet confirmed** — root causes (5 JS scroll listeners, 4 concurrent rAF
  loops, per-frame text writes) and the ScrollTimeline migration path are filed as plans/009.
- Results: score.motion.dev/results/6dafe3f2-… and …/ece288d6-… · shot: design/screens/impl/motionscore-2026-07-15.png

## Open follow-ups (carried, owner-visible)
1. **HARD GATE**: feed-degraded surface must merge before the first `lib/ws.ts` consumer (ws.ts:11
   silently retries forever; "FEED 42ms" would assert liveness over frozen prices).
2. eq-bar infinite loop → bind to Booth-speaking state, pause offscreen.
3. Rail Δ-vs-open micro-column (elevation next rung; movers already compute it).
4. Flip the PROTOTYPE banner copy in the same commit that first calls connect().
5. plans/009 — lift desktop Thrashing C.
