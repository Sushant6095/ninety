# PROVENANCE — component build ledger (Part 5 gate)

One row per component touched in the rebuild. **design-cop criterion 12 FAILS any non-Ninety component in a
diff that has no row here.** `hand-build` is legal ONLY for the six Ninety-specific pieces (MomentumRiver,
MatchCard, PriceChip, trade ticket, ProofBadge, Booth), and only with the searches that came up empty logged.

Router rows are defined in `.claude/skills/ui-craft/SKILL.md §0`.

| Component | Router row | Tool called | Searched (incl. misses) | Sofascore ref | Re-skinned | Shot |
|---|---|---|---|---|---|---|
| BoothLine (terminal/BoothLine.tsx) | Ninety-specific / hand-build | hand-build | shadcn:n/a · magicui:n/a — bespoke halt choreography | motion.md (feedback-not-entertainment) | tokens ✓ | pending |
| Halt overlay (terminal/BigRiver.tsx flash/sweep/wash/cliff/spread) | Ninety-specific / hand-build | hand-build | shadcn:n/a · magicui:n/a — bespoke halt choreography | motion.md (feedback-not-entertainment) | tokens ✓ | pending |
| Halt sequence controller (terminal/useHaltSequence.ts) | Ninety-specific / hand-build | hand-build | shadcn:n/a · magicui:n/a — bespoke halt choreography | motion.md (feedback-not-entertainment) | tokens ✓ | pending |
| Knockout bracket (bracket/BracketB.tsx) | Football-product structure / Ninety-specific — hand-build | hand-build + GSAP round-reveal | shadcn:MISS (no bracket/tournament item, query "tournament bracket knockout tree") · magicui:MISS (animated-candy catalog — marquee/ticker/bento, no data-viz bracket) · 21st.dev:MISS (only generic file-tree "Tree" views + a decorative "Fractal Bloom Tree" — wrong semantics; a knockout tree is a converging match graph, not a collapsible tree-view) | n/a (bespoke tournament tree; Sofascore has no drop-in) | tokens ✓ | bracket-reveal.{lg,xl} ✓ |
