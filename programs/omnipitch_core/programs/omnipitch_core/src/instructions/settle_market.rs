use anchor_lang::prelude::*; use crate::{state::Market, proof};
#[derive(Accounts)]
pub struct SettleMarket<'info> { #[account(mut)] pub market: Account<'info, Market>, pub caller: Signer<'info> }
pub fn handler(ctx: Context<SettleMarket>, result: u8, proof_bytes: Vec<u8>) -> Result<()> {
    let m = &mut ctx.accounts.market;
    require!(m.status < 3, proof::OmniError::AlreadySettled);
    proof::verify_txline_proof(result, &proof_bytes)?;   // ← the crown jewel; no bypass exists
    m.result = result; m.status = 3; m.settled_slot = Clock::get()?.slot; Ok(())
}
