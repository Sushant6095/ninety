use anchor_lang::prelude::*; use crate::state::Market;
#[derive(Accounts)]
#[instruction(match_id: String)]
pub struct InitializeMarket<'info> {
    #[account(init, payer = payer, space = 8 + 256, seeds = [b"market", match_id.as_bytes()], bump)]
    pub market: Account<'info, Market>,
    #[account(mut)] pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
pub fn handler(ctx: Context<InitializeMarket>, match_id: String, kickoff: i64) -> Result<()> {
    let m = &mut ctx.accounts.market; m.match_id = match_id; m.kickoff = kickoff; m.status = 0; Ok(())
}
