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
| Lineups pitch (terminal/depth/Lineups.tsx) | Football-product structure → sofascore-research — hand-build | hand-build (native SVG, NO iframe) | shadcn/magicui/21st n/a (football-depth lane → sofascore-research); no token-native pitch primitive exists | lineups (score-header + pitch); tokens-only markings, no grass | tokens ✓ | terminal-tab-lineups.png ✓ |
| Match stats bars (terminal/depth/MatchStats.tsx) | Football-product structure → sofascore-research — hand-build | hand-build | shadcn/magicui/21st n/a (football-depth lane → sofascore-research) | data-viz.md (two-tone proportional comparison bars) | tokens ✓ | terminal-tab-stats.png ✓ |
| H2H / form (terminal/depth/H2H.tsx) | Football-product structure → sofascore-research — hand-build | hand-build | shadcn/magicui/21st n/a (football-depth lane → sofascore-research) | recent-form pills + head-to-head meetings | tokens ✓ | terminal-tab-h2h.png ✓ |
| Flag disc (components/ui/Flag.tsx) | Any image → next/image | next/image + flagcdn PNG | n/a — image primitive, not a component pull; explicit width/height, lazy | n/a | tokens ✓ (hairline disc, ring) | in every terminal/board still |
| Match depth tabs (terminal/MatchTabs.tsx) | Generic primitive (tabs) → radix/shadcn | radix-ui Tabs (installed) re-skinned | radix Tabs is the sanctioned tabs primitive — re-skinned to tokens, not hand-rolled | tabs.md | tokens ✓ | terminal-tab-*.png ✓ |
| Events incident timeline (terminal/depth/EventsTimeline.tsx) | Football-product structure → sofascore-research — hand-build | hand-build | shadcn/magicui/21st n/a (football-depth lane routes to sofascore-research, not a UI registry); market-aware minute feed has no drop-in | incident-timeline.md (center spine, minute markers, glyphs, running score) | tokens ✓ (cards neutral — amber is halt-only) | terminal-tab-events.png ✓ |
| Knockout bracket (bracket/BracketB.tsx) | Football-product structure / Ninety-specific — hand-build | hand-build + GSAP round-reveal | shadcn:MISS (no bracket/tournament item, query "tournament bracket knockout tree") · magicui:MISS (animated-candy catalog — marquee/ticker/bento, no data-viz bracket) · 21st.dev:MISS (only generic file-tree "Tree" views + a decorative "Fractal Bloom Tree" — wrong semantics; a knockout tree is a converging match graph, not a collapsible tree-view) | n/a (bespoke tournament tree; Sofascore has no drop-in) | tokens ✓ | bracket-reveal.{lg,xl} ✓ |
