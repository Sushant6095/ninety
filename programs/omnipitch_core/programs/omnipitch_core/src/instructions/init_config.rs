use anchor_lang::prelude::*;
use crate::state::Config;

// One-time program config (prompt 20). Sets the authority allowed to post leaderboard roots. The Config PDA's
// `init` makes this callable exactly once. FRONT-RUN NOTE (proof-auditor MEDIUM): on a fresh deploy, whoever
// lands init_config first wins `authority` — mitigated in practice by an ATOMIC deploy+init (scripts/init-vault.ts
// runs both back-to-back). An upgrade-authority gate is the hardening follow-up (ADR-031); it needs the program
// deployed upgradeable with a known authority, which the `anchor test` localnet does not provide cleanly.
#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(init, payer = payer, space = 8 + 32 + 1, seeds = [b"config"], bump)]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitConfig>, authority: Pubkey) -> Result<()> {
    let c = &mut ctx.accounts.config;
    c.authority = authority;
    c.bump = ctx.bumps.config;
    Ok(())
}
