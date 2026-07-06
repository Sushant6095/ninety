use anchor_lang::prelude::*;
#[derive(Accounts)] pub struct ClaimPoints<'info> { pub claimer: Signer<'info> }
pub fn handler(_ctx: Context<ClaimPoints>, _epoch: u32, _amount: u64, _merkle_proof: Vec<[u8; 32]>) -> Result<()> { Ok(()) }
