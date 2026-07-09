# ADR 045 Match-row sparks are inline SVG; lightweight-charts is reserved for the hero River (apps/web, Phase 4 frontend)

Status: accepted 2026-07-09. Context: the queue's chunk 3 says "mini-River on the card (lightweight-charts, series.update())". The Home match list renders many rows (a dozen+), each with a small price line.

Decision:
- **Match-row micro-sparks = inline `<svg><polyline>`** (`components/ui/Sparkline.tsx`) — colored `--up`/`--down` by direction, no dependency. Cheap, static per render, no canvas.
- **lightweight-charts is reserved for the ONE hero River** — the Featured panel on Home and the match-view LIVE River (≥45% viewport, `series.update()` only). Those get a live, updating canvas chart.

Rationale: instantiating a lightweight-charts canvas PER LIST ROW (a dozen+ charts, each a canvas + its own update loop) is exactly the re-render/perf disaster the ui-craft Definition of Done forbids ("hot path free of re-render storms, `series.update()` only"). Sofascore/Hyperliquid/Polymarket all use cheap row sparks and one big chart. The library law ("lightweight-charts is the only chart lib") governs actual CHARTS; a 68×28 SVG polyline in a table cell is a primitive, not a second charting library.

Consequences: the list scrolls cheaply; the hero River (chunk 3 Featured + the match view) is the one place lightweight-charts + live `series.update()` live. VERIFY: Home renders the full grouped list at parity with `design/screens/home.png`; no per-row canvas. Cross-ref: ui-craft skill (§3 River, §7 library law, §10 DoD), the `momentum-river` skill (the hero chart).
