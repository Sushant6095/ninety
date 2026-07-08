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
// ⚠ This is the OLD `validate_stat` discriminator (the only one in our stale IDL). TxLINE now directs settlement to
// `validateStatV2` (sanctioned path; manual Merkle verify / Plan B is unsupported until they publish the hash spec).
// Before flipping SETTLEMENT_LIVE, replace this disc + ValidateStatArgs with validateStatV2's from the updated IDL.
const VALIDATE_STAT_DISC: [u8; 8] = [107, 197, 232, 90, 191, 136, 105, 185];
pub const EPOCH_DAY_SECS: i64 = 86_400;

// The home/away total-goals statKeys (K1 scores feed, admin-confirmed 2026-07-08): statKey 1 = Participant 1 (home)
// total goals, statKey 2 = Participant 2 (away) total goals. "Final" is NOT a period value — it is the score record
// whose Action == "game_finalised", selected OFF-CHAIN when fetching the proof (packages/txline finalisedStatProof).
pub const STAT_KEY_HOME_GOALS: u32 = 1;
pub const STAT_KEY_AWAY_GOALS: u32 = 2;

// SETTLEMENT REMAINS DISABLED (fail-closed) until two on-chain-unresolved gates land — see ADR-037:
//   (1) FINALITY: validate_stat proves a stat is anchored in SOME event sub-tree (any match moment), NOT that the
//       record is game_finalised. A permissionless caller could prove statKey 1 from a MID-MATCH batch where the home
//       side led → wrong-result forge via batch/seq selection. Enforcing "this proof IS the finalised record" needs
//       the sanctioned validateStatV2 instruction, whose interface/accounts are NOT in our IDL (recon-blocked).
//   (2) SHOOTOUT DECISION: statKeys 1,2 are TOTAL GOALS, so a penalty win reads level (e.g. 1–1 won on pens) → the
//       home−away predicate returns DRAW for a match that has a winner. Needs the game_finalised decision/winner stat.
// Flipping SETTLEMENT_LIVE to true ALSO requires re-pointing the CPI at validateStatV2 (disc + args from the updated IDL).
pub const SETTLEMENT_LIVE: bool = false;

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
