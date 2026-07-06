use anchor_lang::prelude::*;
#[derive(Accounts)] pub struct MintMoment<'info> { pub payer: Signer<'info> }
pub fn handler(_ctx: Context<MintMoment>, _metadata_uri: String) -> Result<()> { Ok(()) }
