use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::proof::OmniError;
use crate::state::{ClaimReceipt, PointsEpoch};
use crate::merkle;

// Claim leaderboard points (prompt 20). Verifies Merkle inclusion of leaf=(claimer, amount) against the epoch's
// posted root, guards double-claim via a per-(epoch, claimer) receipt PDA whose `init` FAILS on replay, then
// transfers `amount` tokens from the vault to the claimer, signed by the vault-authority PDA. No admin bypass.
#[derive(Accounts)]
#[instruction(epoch: u32)]
pub struct ClaimPoints<'info> {
    #[account(seeds = [b"points".as_ref(), &epoch.to_le_bytes()], bump)]
    pub points_epoch: Account<'info, PointsEpoch>,
    // Double-claim guard: init fails (account already in use) if this (epoch, claimer) already claimed.
    #[account(init, payer = claimer, space = 8 + 8, seeds = [b"claim".as_ref(), &epoch.to_le_bytes(), claimer.key().as_ref()], bump)]
    pub receipt: Account<'info, ClaimReceipt>,
    #[account(mut)]
    pub claimer: Signer<'info>,
    #[account(mut, seeds = [b"vault"], bump)]
    pub vault: Account<'info, TokenAccount>,
    /// CHECK: vault owner PDA; signs the transfer via its seeds. Not read/written directly.
    #[account(seeds = [b"vault_auth"], bump)]
    pub vault_authority: UncheckedAccount<'info>,
    #[account(seeds = [b"mint"], bump)]
    pub mint: Account<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = claimer)]
    pub claimer_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimPoints>, _epoch: u32, amount: u64, merkle_proof: Vec<[u8; 32]>) -> Result<()> {
    // 1) prove the (claimer, amount) leaf is in the epoch's committed root
    let leaf = merkle::leaf_hash(&ctx.accounts.claimer.key().to_bytes(), amount);
    require!(
        merkle::verify_proof(leaf, &merkle_proof, ctx.accounts.points_epoch.root),
        OmniError::InvalidProof
    );
    // 2) record the claim (the receipt PDA's existence is the replay guard; its init already happened)
    ctx.accounts.receipt.amount = amount;
    // 3) pay out from the vault, signed by the vault-authority PDA
    let bump = ctx.bumps.vault_authority;
    let seeds: &[&[u8]] = &[b"vault_auth", &[bump]];
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.claimer_ata.to_account_info(),
                authority: ctx.accounts.vault_authority.to_account_info(),
            },
            &[seeds],
        ),
        amount,
    )
}
