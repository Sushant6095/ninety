use anchor_lang::prelude::*;
// DEFERRED (ADR-032, prompt 21 cut): the on-chain path mints a Metaplex Bubblegum compressed NFT (cNFT) of a
// market's biggest-swing Moment via CPI, gated off-chain by MOMENTS_ONCHAIN (apps/worker-jobs/moments.ts).
// mpl-bubblegum's Rust CPI compiles against this graph, but the VERIFY (a cNFT on devnet visible via Helius DAS)
// needs a devnet Bubblegum tree + HELIUS_API_KEY (unset) — >half-a-day of setup for a cosmetic feature, so cut for
// v1. This stays a no-op stub until the tree + key are provisioned; then wire mpl_bubblegum::MintV1Cpi here.
#[derive(Accounts)]
pub struct MintMoment<'info> {
    pub payer: Signer<'info>,
}
pub fn handler(_ctx: Context<MintMoment>, _metadata_uri: String) -> Result<()> {
    Ok(())
}
