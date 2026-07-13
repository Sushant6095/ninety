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
