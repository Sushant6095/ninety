use anchor_lang::prelude::*;
pub mod state; pub mod proof; pub mod merkle; pub mod txoracle_cpi; pub mod instructions;
use instructions::*;
use txoracle_cpi::{ProofNode, ScoresBatchSummary, StatTerm};

declare_id!("6ps8ao7CVhacnRajvFXWTmkknsRnHfEbWmtQ3nDCdBkj");

// Trust layer ONLY (CLAUDE.md law). Trading never happens here.
#[program]
pub mod omnipitch_core {
    use super::*;
    pub fn initialize_market(ctx: Context<InitializeMarket>, match_id: String, kickoff: i64) -> Result<()> { instructions::initialize_market::handler(ctx, match_id, kickoff) }
    /// One-time config: set the authority allowed to post leaderboard roots.
    pub fn init_config(ctx: Context<InitConfig>, authority: Pubkey) -> Result<()> { instructions::init_config::handler(ctx, authority) }
    /// Create the points mint (authority = PDA) + vault and mint the claim supply into it.
    pub fn init_vault(ctx: Context<InitVault>) -> Result<()> { instructions::init_vault::handler(ctx) }
    /// Permissionless, one-shot. CPIs txoracle.validate_stat to verify the score proof (two-stat home−away
    /// predicate derived on-chain from `result`) BEFORE writing the result. No admin result path — do not add one.
    #[allow(clippy::too_many_arguments)]
    pub fn settle_market(ctx: Context<SettleMarket>, result: u8, ts: i64, fixture_summary: ScoresBatchSummary, fixture_proof: Vec<ProofNode>, main_tree_proof: Vec<ProofNode>, stat_home: StatTerm, stat_away: StatTerm) -> Result<()> {
        instructions::settle_market::handler(ctx, result, ts, fixture_summary, fixture_proof, main_tree_proof, stat_home, stat_away)
    }
    pub fn post_leaderboard_root(ctx: Context<PostRoot>, epoch: u32, root: [u8; 32]) -> Result<()> { instructions::post_leaderboard_root::handler(ctx, epoch, root) }
    pub fn claim_points(ctx: Context<ClaimPoints>, epoch: u32, amount: u64, merkle_proof: Vec<[u8; 32]>) -> Result<()> { instructions::claim_points::handler(ctx, epoch, amount, merkle_proof) }
    pub fn mint_moment(ctx: Context<MintMoment>, metadata_uri: String) -> Result<()> { instructions::mint_moment::handler(ctx, metadata_uri) }
}
