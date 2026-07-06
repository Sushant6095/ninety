---
name: momentum-river
description: Use when building or modifying the Momentum River chart, mini-river on MatchCards, price chart rendering, chart event glyphs, or anything involving lightweight-charts in apps/web.
---
# Momentum River — the signature component
Procedure: 1) render with lightweight-charts area series (fallback custom canvas only if glyph pinning fails); 2) probability axis fixed 0–100, x-axis plots to 90' — unplayed time stays EMPTY; 3) goal/red glyphs pinned to event timestamps from m:{id}:events frames; 4) tick updates via series.update() never full re-render (60fps rule); 5) hero ≥45% viewport on match view, mini variant is sparkline-quiet.
Constraints: colors only var(--up)/var(--down)/var(--halt); halt state = amber sweep overlay; respect prefers-reduced-motion; all boldness lives HERE — if this chart is quiet the screen is wrong, if anything else is loud the screen is wrong.
References: design/screens/*.png · design/DECISIONS.md · apps/web/src/components/ui/MomentumRiver.tsx
