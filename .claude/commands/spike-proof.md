---
description: Run the Day-0 settlement proof spike (docs/TXLINE-MAP.md §3)
---
Execute the proof spike per docs/TXLINE-MAP.md §3 and §4 step 5:
1. Fetch a stat-validation bundle for a finished fixture via packages/txline (save sample to docs/txline-samples/).
2. Reproduce TxLINE's validateStat example against devnet (1.4M CU budget).
3. Attempt the same via CPI from a scratch Anchor program.
4. Record the outcome (CPI works → Plan A / view-only → Plan B) with the adr-scribe subagent as ADR-009, and update programs/.../proof.rs accordingly.
Then have the proof-auditor subagent review.
