use anchor_lang::prelude::*;
/// SETTLEMENT PROOF — VERDICT: PLAN A (CPI txoracle.validate_stat). Decided by the 07 spike
/// (ADR-017, 2026-07-07), proven live on devnet. NOTE: numbered ADR-017, not "ADR-009" as the
/// prompt said — ADR-009 already exists (Postgres port) and ADRs are immutable (adr-scribe rule 5).
///
/// Evidence: `validate_stat` verifies the score Merkle proof against PDA
/// ["daily_scores_roots", epochDay as u16-LE] and returns validity via Solana return_data. A live
/// two-stat (home − away vs 0) validation returned true — devnet sig
/// 4JRA6qA6h4sZ1XBrrxngBoFXZ3MYRU2h38jVBqU1VKHgfPZfz1RWrpfZ2fBkeGHmS4E3UE1RvtUqvT8tGYUopBZ1 —
/// consuming only 282,851 CU (« the 1.4M per-tx max), so a CPI fits inside settle_market.
///
/// Wiring plan (later prompt — anchor build is toolchain-blocked here, see ADR-017).
/// proof-auditor MUST-FIXES baked in (a valid proof for the wrong fixture/moment must NOT settle):
///   1. BIND to the market: take the Market in; require the proof's fixtureId == market.match_id and
///      derive epochDay from market.kickoff ON-CHAIN — never from the caller (C1).
///   2. PIN the trust surface: `const TXORACLE_ID`; derive daily_scores_merkle_roots =
///      PDA(["daily_scores_roots", epochDay u16-LE], TXORACLE_ID); reject any caller-supplied
///      program id or roots account (C2).
///   3. Prove FINISHED incl. extra time from the SAME merkle-anchored ScoresBatchSummary — a
///      home−away>0 snapshot at 90' is forgeable if the tie goes to ET (C3).
///   4. Derive the predicate from `result` IN-PROGRAM: HOME⇔(home−away)>0, AWAY⇔<0,
///      DRAW⇔both false / equality op; fail-closed if the oracle offers neither (C4).
///   5. invoke() validate_stat with the single read-only roots PDA (ComputeBudget 1.4M); then
///      get_return_data(): require program == TXORACLE_ID, exact length, byte == 1; None/empty ⇒ reject (H2).
///   Only then write result. NO admin path.
///
/// Plan B (replicate the Merkle verification here) REJECTED: it would duplicate TxLINE's audited
/// verification for no gain now that CPI is confirmed feasible and cheap — keep the trust surface
/// in their program. Settlement without a valid TxLINE proof must remain IMPOSSIBLE.
pub fn verify_txline_proof(_result: u8, _proof: &[u8]) -> Result<()> {
    err!(OmniError::ProofNotImplemented)
}
#[error_code]
pub enum OmniError { #[msg("proof verification not implemented")] ProofNotImplemented, #[msg("invalid proof")] InvalidProof, #[msg("already settled")] AlreadySettled }
