//! CPI into TxLINE's txoracle.validate_stat — the ONLY settlement trust surface (ADR-017 Plan A). The txoracle
//! verifies a score's Merkle proof against its anchored daily_scores_roots PDA and returns validity via return_data.
//! We forward the proof and derive the predicate ON-CHAIN from the claimed result, so a valid proof can only settle
//! the result it actually proves. Types below MUST match txoracle IDL v1.4.2 (packages/txline/txoracle.json).
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::{get_return_data, invoke},
};
use crate::proof::OmniError;

/// Pinned trust surface (proof-auditor C2): the devnet txoracle program. NEVER caller-supplied.
pub const TXORACLE_ID: Pubkey = anchor_lang::pubkey!("6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J");
const VALIDATE_STAT_DISC: [u8; 8] = [107, 197, 232, 90, 191, 136, 105, 185];
pub const EPOCH_DAY_SECS: i64 = 86_400;

// FINAL home/away-goals statKeys + FINISHED period — the stat identity the two-stat predicate is built on.
// ⚠ SETTLEMENT IS DELIBERATELY DISABLED (fail-closed) until STEP-0. These are IMPOSSIBLE SENTINELS, not the real
// encodings: no leaf in daily_scores_roots is keyed u32::MAX / period i32::MAX, so txoracle can never validate a proof
// for them → EVERY settle is rejected. This is intentional. ADR-017/ADR-015 observed the live 1002/1003 stats are REAL
// but are NOT goals (1002=2,1003=1 while the score was 1–3); pinning 1002/1003 would let an attacker forge a result
// with a GENUINE proof for a real-but-wrong stat (proof-auditor C-1 re-verify refuted the "unconfirmed ⇒ fail-closed"
// claim — a real-but-wrong key is strictly MORE dangerous than an impossible one). STEP-0 must confirm the true FINAL
// home/away-goals keys + the terminal (finished-incl-ET, uniquely-anchored) period and replace these three values;
// only then does settlement go live. Until then the CPI path is wired + reviewed but cannot settle anything. See ADR-036.
pub const STAT_KEY_HOME_GOALS: u32 = u32::MAX;
pub const STAT_KEY_AWAY_GOALS: u32 = u32::MAX - 1;
pub const PERIOD_FINAL: i32 = i32::MAX;

// --- txoracle types (borsh layout MUST match the IDL) ---
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ScoreStat { pub key: u32, pub value: i32, pub period: i32 }
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ScoresUpdateStats { pub update_count: i32, pub min_timestamp: i64, pub max_timestamp: i64 }
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ScoresBatchSummary { pub fixture_id: i64, pub update_stats: ScoresUpdateStats, pub events_sub_tree_root: [u8; 32] }
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ProofNode { pub hash: [u8; 32], pub is_right_sibling: bool }
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct StatTerm { pub stat_to_prove: ScoreStat, pub event_stat_root: [u8; 32], pub stat_proof: Vec<ProofNode> }
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum Comparison { GreaterThan, LessThan, EqualTo }
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum BinaryExpression { Add, Subtract }
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TraderPredicate { pub threshold: i32, pub comparison: Comparison }

// validate_stat args, in IDL order.
#[derive(AnchorSerialize)]
struct ValidateStatArgs {
    ts: i64,
    fixture_summary: ScoresBatchSummary,
    fixture_proof: Vec<ProofNode>,
    main_tree_proof: Vec<ProofNode>,
    predicate: TraderPredicate,
    stat_a: StatTerm,
    stat_b: Option<StatTerm>,
    op: Option<BinaryExpression>,
}

/// The daily_scores_roots PDA for an epochDay (u16-LE seed), owned by the txoracle (C2).
pub fn daily_scores_roots_pda(epoch_day: u16) -> Pubkey {
    Pubkey::find_program_address(&[b"daily_scores_roots", &epoch_day.to_le_bytes()], &TXORACLE_ID).0
}

/// H/D/A (1/2/3) → the home−away comparison. DRAW uses EqualTo — the txoracle Comparison enum supports it, so a
/// draw is provable directly (resolves the proof.rs C4 "equality predicate if available" open question).
pub fn comparison_for(result: u8) -> Result<Comparison> {
    match result {
        1 => Ok(Comparison::GreaterThan), // HOME: home − away > 0
        2 => Ok(Comparison::EqualTo),     // DRAW: home − away == 0
        3 => Ok(Comparison::LessThan),    // AWAY: home − away < 0
        _ => err!(OmniError::InvalidProof),
    }
}

/// CPI txoracle.validate_stat with the two-stat (home − away) predicate derived from `result`; then require the
/// oracle returned validity == 1 FROM TXORACLE_ID (proof-auditor H2 — None/empty/0/other-program ⇒ reject).
#[allow(clippy::too_many_arguments)]
pub fn cpi_validate(
    txoracle_program: &AccountInfo,
    roots: &AccountInfo,
    result: u8,
    ts: i64,
    fixture_summary: ScoresBatchSummary,
    fixture_proof: Vec<ProofNode>,
    main_tree_proof: Vec<ProofNode>,
    stat_home: StatTerm,
    stat_away: StatTerm,
) -> Result<()> {
    require_keys_eq!(*txoracle_program.key, TXORACLE_ID, OmniError::Unauthorized); // C2
    let args = ValidateStatArgs {
        ts,
        fixture_summary,
        fixture_proof,
        main_tree_proof,
        predicate: TraderPredicate { threshold: 0, comparison: comparison_for(result)? }, // C4: predicate from result, on-chain
        stat_a: stat_home,
        stat_b: Some(stat_away),
        op: Some(BinaryExpression::Subtract), // two-stat: home − away
    };
    let mut data = VALIDATE_STAT_DISC.to_vec();
    data.extend(args.try_to_vec()?);
    let ix = Instruction { program_id: TXORACLE_ID, accounts: vec![AccountMeta::new_readonly(*roots.key, false)], data };
    invoke(&ix, &[roots.clone()])?; // the settle TX carries ComputeBudget 1.4M (the caller's tx builder adds it)
    match get_return_data() {
        Some((program, ret)) if program == TXORACLE_ID && ret == [1u8] => Ok(()), // H2
        _ => err!(OmniError::InvalidProof),
    }
}
