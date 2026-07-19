# Ralph verdict — /proofs (route pass 9, pass 21) — THE HONESTY GATE

- **Date:** 2026-07-19 · Anchor: real Sofascore capture + slop taxonomy (NOT bare-DOM HL, B5)
- **Composite:** `design/verdicts/composites/2026-07-19-proofs-vs-sofa.png`

## HONESTY GATE — PASSES (this was the audit's flagged defect class; it is clean).
- **ZERO rendered Solscan links** (DOM `a[href*=solscan]` = 0). Settlement is fail-closed (ADR-036/037), so
  **every one of the 88 rows shows a "⏱ Proof pending" chip** (8 visible; DOM pending count 8) instead of a link.
- **No baked dead link in the build:** grep of `.next` finds only the runtime template `solscan.io/tx/${a}?cluster=devnet`
  — no `solscan.io/tx/<literal-sig>`. A link is built ONLY when a real sig exists; today none do → none render.
- **Candid disclosure** (not fake confidence): "fail-closed on purpose: … `validate_stat_v2` does not bind finality
  on-chain, so a genuine mid-match proof could settle a wrong result. We disabled settlement rather than ship
  something we can prove is forgeable. Proofs go live the moment finality binding is confirmed." Status bar: "88
  RESULTS DECIDED · RESULT · TXLINE CONSENSUS · SETTLEMENT · FAIL-CLOSED (ADR-036/037)".
- on-chain violet (--chain) used ONLY on the proof-pending chips + settlement label.

## READ-OUT-LOUD — RECONCILES cross-surface.
SRB v CMR 2–1 SRB won (↔ /moments "Serbia seal it" SRB 72→92, /history SRB sell) · MEX v RSA 2–0 MEX won (↔
/competition Group A Mexico top, 9 pts) · BRA v HAI 4–0 BRA won (↔ /history BRA +800) · "88 RESULTS DECIDED" ↔ the
"Proofs 88" nav badge. Scores use the score en-dash (2–1, 4–0) — kept (house convention).

## THREE WAYS OURS WAS WORSE (from the composite)
1. **One prose em-dash (9.G)** — "decided by TxLINE consensus — no admin can change it". Fixed → period. DOM re-check: em-dash = 0.
2. **No live proofs yet** (fail-closed, B1) — but that is the HONEST state, disclosed with the reason; not a slop defect.
3. The Sofascore reference has no proof log; comparison is cross-kind — ours is a focused, honest settlement log.

## MECHANICAL CHECKS
- Em-dash (visible): **0.** Banned play-money vocab: **0.** Solscan links: **0** (fail-closed). Pending chips: 8.

## SLOP TAXONOMY: S1–S10 all 0.
Real result/proof rows (not S3 cards), no dead links (the audit's flagged defect — clean), on-chain violet scoped
correctly, numbers reconcile cross-surface, 9.G cleared.

## GATES
Clean prod build ✓ · dark ✓ · tokens only · ZERO dead Solscan hrefs (built + DOM) · fail-closed honesty intact.
