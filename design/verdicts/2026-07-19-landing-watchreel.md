# Ralph verdict — landing WATCHREEL / "The film" (pass 6)

- **Date:** 2026-07-19 · Pass 6 · Anchor: real Sofascore captures + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-watchreel-before-after.png`

## Finding: structurally clean; one hard-ban copy defect.
Asymmetric split (headline + copy left, skiper67 click-to-play VideoReel right), specific copy, real video player,
no card grid. It is not a slop offender.

## THREE WAYS OURS WAS WORSE (from the composite)
1. **Em-dash in visible copy (9.G hard ban)** — "Press play — it opens full screen." Fixed → "Press play. It
   opens full screen." (verified via DOM textContent, not eyeballed).
2. **The asset is a named-player likeness** — the poster/reel is the same anime Messi/Argentina clip as beat 1
   (B6 extended). Owner must swap before public ship; the player is asset-agnostic (src/poster are props). Logged, not blocking.
3. **Copy leans on repetition of the loop verbs** ("the game moving, the price moving with it, the result proven
   on-chain") — acceptable: it's the film's one-line thesis, and the verbs are the product's actual loop, not filler.

## FIX
Single visible-copy change (em-dash → period). Two em-dashes remain in WatchReel.tsx but both are in code
COMMENTS (the B6 asset warning), not rendered — not a 9.G violation.

## SLOP TAXONOMY (after): S1–S10 all 0.
S7 asymmetric split · S3 no card grid · S5 specific copy · S8 the reel is the section's payload (motivated) · S9 no collisions · S10 no unsourced numbers · 9.G em-dash cleared.

## GATES
Clean prod build ✓ · dark ✓ · 0 console errors · tokens only · reduced-motion (skiper67 poster-first, no autoplay). B6 asset outstanding (owner).
