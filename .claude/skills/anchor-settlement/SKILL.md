---
name: anchor-settlement
description: Use when working on programs/omnipitch_core — settle_market, proof verification, PDAs, claims, cNFT moments, or any Anchor/Solana program change.
---
# Settlement program procedure
1) settle_market stays permissionless + one-shot, gated ONLY by verify_txline_proof (Plan A: CPI txoracle.validateStat with two-stat predicate home−away vs 0, 1.4M CU; Plan B: replicate Merkle verify vs daily_scores_roots PDA) — see docs/TXLINE-MAP.md §3. 2) Settle on FINISHED status stat, never 90' score (extra time!). 3) Every change → anchor build + proof-auditor subagent review. 4) Tests must include: settle-without-proof FAILS, double-settle FAILS. 5) No admin/override paths — hook blocks, don't try.
References: programs/.../proof.rs · docs/adr/ADR-003 · Anchor book
