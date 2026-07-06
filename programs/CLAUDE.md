# programs/ session memory
Trust layer only. settle_market is permissionless and gated ONLY by verify_txline_proof (plan in docs/TXLINE-MAP.md §3 — txoracle validateStat, 1.4M CU). NO admin result path — the hook blocks attempts; don't try.
Extra-time trap: settle on FINISHED status, never on the 90' score. After changes: proof-auditor subagent review + `anchor build`.
