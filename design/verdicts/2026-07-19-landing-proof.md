# Ralph verdict — landing PROOF / on-chain section (pass 2)

- **Date:** 2026-07-19 · Branch: `merge/live-integration` · Pass 2 of the 3→9 loop
- **Anchor:** real Sofascore captures + mechanical slop taxonomy (NOT the bare-DOM HL page, B5).
- **Composite (attached):** `design/verdicts/composites/2026-07-19-proof-before-after.png` (BEFORE 3-up grid | AFTER trust-path | REF Sofascore). Also `2026-07-19-proof-vs-sofa.png`.

## THREE WAYS OURS WAS WORSE (named from the composite, before fixing)
1. **Told instead of shown.** Sofascore conveys trust via functional widgets (real Team-of-week ratings, a live vote poll); ours was three static prose columns (`01/02/03` + heading + 2 lines) — the generic marketing "how it works" grid.
2. **No within-section hierarchy (S1/S3).** Three identical-weight columns, no crescendo.
3. **FlowField decorative, not connected (S8).** The signed-data streams behind didn't link the three steps into a chain, losing the chain-of-custody meaning the section is about.

## FIX (subtract the card framing, elevate to a connected path)
Replaced the `grid sm:grid-cols-3` with a directional trust-PATH: numbered `--chain` nodes (01→02→03) sitting on a
left-to-right `--chain` rail that fades forward (feed → program → public), titles/copy below each node. Mobile
stacks (rail hidden). The rail now carries the meaning (chain of custody) and matches the FlowField behind.
On-chain violet is sanctioned here (this is THE on-chain surface, CLAUDE.md).

## SLOP TAXONOMY (PROOF, after)
- **S3 FIXED** — connected directional stepper, not a 3-up equal card grid. 0.
- **S8 FIXED** — the rail connector carries the chain meaning (motion/structure motivated). 0.
- S1 sequence (crescendo not required in a stepper) · S5 specific copy · S6 display ≫ body · S7 left-aligned · S9 no collisions (the nav overlap in the shot is a fixed-nav scroll artifact, not a layout collision) · S10 no unsourced numbers. All 0.

## OWNER-PROXY
Screenshot-to-a-friend? The trust-path over the streaming FlowField reads as an on-chain surface, not a generic
explainer. One thing not seen elsewhere here: the proof steps drawn as a signed-data chain, not bullet cards.

## GATES
Clean prod build ✓ · dark theme ✓ · 0 console errors · tokens only (chain = on-chain, sanctioned) · reduced-motion (rail is static CSS, no animation).
