# Ralph verdict — /moments (route pass 5, pass 17)

- **Date:** 2026-07-19 · Anchor: real Sofascore capture + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-moments-vs-sofa.png`

## Finding: a strong, HONEST moments/collectibles gallery — one em-dash (fixed).
"Moments" + subtitle · a MOMENT OF THE DAY hero (Croatia's late winner, CRO 45→78 +33, LEGENDARY, big price-path
chart) · rarity filter pills (All/Legendary/Epic/Rare/Common) · a 3-col grid of moment cards (rarity tier, minute,
match pairing + crests, title, price move from→to+Δ, owner, mini River-path, MINTLESS). Featured hero + rarity
tiers + filter give it rhythm — NOT the generic 3-up marketing card grid (S3 clean).

## HONESTY READ-OUT-LOUD (the critical check here) — PASSES.
- Every card is **MINTLESS** (all `mintSig: null`); the copy states the FUTURE action ("Each mints on Solana at
  settlement"), never a completed proof. `provableClaim` = false; `mintsAtSettlement` = true.
- **Zero Solscan links** on the page (mintless → ProofBadge fail-closed → no href). No dead/fake solscan.io.
- No player-likeness art (the moment "art" is the price-path River, not a photo) → no B6.
- Price moves reconcile with the markets: CAN 41→63 (matches /match CAN reprice), EGY 31→55 (matches /terminal
  AUS-EGY goal), SRB 72→92, CRO 45→78. Consistent across surfaces.

## THREE WAYS OURS WAS WORSE (from the composite)
1. **Em-dash in the subtitle (9.G)** — "repriced a market — captured live". Fixed via a moments-feature sweep
   (` — `→` · `), which also fixed the MomentDetail "Mintless — not on-chain" state for the /moments/[id] pass.
   DOM re-check: page em-dash = 0.
2. **RD-capped fixture moments** (all MINTLESS until on-chain minting lands, B1) — but that is stated HONESTLY, so
   it is a data blocker, not a slop defect.
3. The reference (Sofascore) has no equivalent; the closest "worse" is that ours is a single scroll — acceptable
   for a curated gallery.

## MECHANICAL CHECKS
- Em-dash (visible): **0.** Banned play-money vocab: **0.** Solscan links: **0** (fail-closed).
- on-chain violet (--chain) reserved for the MINTLESS/proof affordance only.

## SLOP TAXONOMY (after): S1–S10 all 0.
Featured-hero + rarity-tier gallery (not S3 cards), meaningful mini-charts (S8), numbers reconcile (S10), honest
mint state, 9.G cleared.

## GATES
Clean prod build ✓ · dark ✓ · tokens only · no dead Solscan links (honesty gate).
