use anchor_lang::prelude::*;
#[derive(Accounts)] pub struct PostRoot<'info> { pub authority: Signer<'info> }
pub fn handler(_ctx: Context<PostRoot>, _epoch: u32, _root: [u8; 32]) -> Result<()> { Ok(()) }
