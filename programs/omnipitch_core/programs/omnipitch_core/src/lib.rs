use anchor_lang::prelude::*;
pub mod state; pub mod proof; pub mod instructions;
use instructions::*;

declare_id!("Fill1nAfterFirstDeploy11111111111111111111111");

// Trust layer ONLY (CLAUDE.md law). Trading never happens here.
#[program]
pub mod omnipitch_core {
    use super::*;
    pub fn initialize_market(ctx: Context<InitializeMarket>, match_id: String, kickoff: i64) -> Result<()> { instructions::initialize_market::handler(ctx, match_id, kickoff) }
    /// Permissionless, one-shot. Verifies TxLINE's validation proof (proof.rs) BEFORE writing the result.
    /// There is deliberately no admin result path — do not add one.
    pub fn settle_market(ctx: Context<SettleMarket>, result: u8, proof: Vec<u8>) -> Result<()> { instructions::settle_market::handler(ctx, result, proof) }
    pub fn post_leaderboard_root(ctx: Context<PostRoot>, epoch: u32, root: [u8; 32]) -> Result<()> { instructions::post_leaderboard_root::handler(ctx, epoch, root) }
    pub fn claim_points(ctx: Context<ClaimPoints>, epoch: u32, amount: u64, merkle_proof: Vec<[u8; 32]>) -> Result<()> { instructions::claim_points::handler(ctx, epoch, amount, merkle_proof) }
    pub fn mint_moment(ctx: Context<MintMoment>, metadata_uri: String) -> Result<()> { instructions::mint_moment::handler(ctx, metadata_uri) }
}
