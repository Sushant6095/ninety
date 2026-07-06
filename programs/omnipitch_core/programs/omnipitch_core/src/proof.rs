use anchor_lang::prelude::*;
/// SETTLEMENT PROOF — designed via docs/TXLINE-MAP.md §3 (Day-0 finding).
/// TxLINE's txoracle program exposes `validateStat` which verifies Merkle proofs
/// against its anchored PDA ["daily_scores_roots", epochDay].
/// Plan A: CPI into txoracle.validateStat with a two-stat predicate
///         (home_goals − away_goals vs 0) matching the claimed result. 1.4M CU budget.
/// Plan B (if validateStat is view-only): replicate their Merkle verification here
///         against the same daily_scores_roots account — proof shapes are documented
///         in examples/onchain-validation (fixtureSummary, subTreeProof, mainTreeProof, statProof).
/// Either way: settlement without a valid TxLINE proof must be IMPOSSIBLE. No admin path.
pub fn verify_txline_proof(_result: u8, _proof: &[u8]) -> Result<()> {
    err!(OmniError::ProofNotImplemented)
}
#[error_code]
pub enum OmniError { #[msg("proof verification not implemented")] ProofNotImplemented, #[msg("invalid proof")] InvalidProof, #[msg("already settled")] AlreadySettled }
