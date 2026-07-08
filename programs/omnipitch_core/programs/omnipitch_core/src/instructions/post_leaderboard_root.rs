use anchor_lang::prelude::*;
use crate::proof::OmniError;
use crate::state::{Config, PointsEpoch};

// Post a leaderboard Merkle root for an epoch (prompt 20). AUTHORITY-GATED: has_one on Config.authority — only
// the configured authority may post. One PointsEpoch PDA per epoch (init → a root can't be silently overwritten).
#[derive(Accounts)]
#[instruction(epoch: u32)]
pub struct PostRoot<'info> {
    #[account(seeds = [b"config"], bump = config.bump, has_one = authority @ OmniError::Unauthorized)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(init, payer = authority, space = 8 + 4 + 32 + 8, seeds = [b"points".as_ref(), &epoch.to_le_bytes()], bump)]
    pub points_epoch: Account<'info, PointsEpoch>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<PostRoot>, epoch: u32, root: [u8; 32]) -> Result<()> {
    let pe = &mut ctx.accounts.points_epoch;
    pe.epoch = epoch;
    pe.root = root;
    pe.total = 0;
    Ok(())
}
