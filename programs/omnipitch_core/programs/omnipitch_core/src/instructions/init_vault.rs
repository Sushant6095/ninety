use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

pub const INITIAL_SUPPLY: u64 = 1_000_000_000; // points supply minted into the vault for claims

// Vault init (prompt 20). Creates the points mint (authority = vault_authority PDA) + the vault token account
// (owner = vault_authority PDA), then mints the claim supply into the vault, signed by the PDA. The program is
// the sole mint authority — points can only enter circulation via this program, never an external minter.
#[derive(Accounts)]
pub struct InitVault<'info> {
    #[account(init, payer = payer, seeds = [b"mint"], bump, mint::decimals = 0, mint::authority = vault_authority)]
    pub mint: Account<'info, Mint>,
    #[account(init, payer = payer, seeds = [b"vault"], bump, token::mint = mint, token::authority = vault_authority)]
    pub vault: Account<'info, TokenAccount>,
    /// CHECK: PDA that owns the mint + vault and signs mint/transfer via its seeds. Not read/written directly.
    #[account(seeds = [b"vault_auth"], bump)]
    pub vault_authority: UncheckedAccount<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitVault>) -> Result<()> {
    let bump = ctx.bumps.vault_authority;
    let seeds: &[&[u8]] = &[b"vault_auth", &[bump]];
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.vault_authority.to_account_info(),
            },
            &[seeds],
        ),
        INITIAL_SUPPLY,
    )
}
