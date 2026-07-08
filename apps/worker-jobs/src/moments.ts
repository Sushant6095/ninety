// Moment = biggest swing per match → render PNG (river cliff card) → upload → (optionally) mint a cNFT.
// MOMENTS_ONCHAIN gates the on-chain Bubblegum cNFT mint (programs/omnipitch_core `mint_moment`).
//
// CUT for v1 (ADR-032): the mpl-bubblegum Rust CPI COMPILES (cargo-check verified — not the blocker), but the
// end-to-end VERIFY ("cNFT on devnet visible via Helius DAS") needs a Helius API key (HELIUS_API_KEY is unset), a
// pre-created devnet Bubblegum concurrent-merkle tree, and the upstream render/upload pipeline (still a stub) —
// >half-a-day of external setup for a cosmetic feature. So MOMENTS_ONCHAIN defaults OFF: moments live off-chain
// (the Moment table / imageUri). Flip it on once a tree + HELIUS_API_KEY are provisioned and the mint tx is wired.
export const MOMENTS_ONCHAIN = process.env.MOMENTS_ONCHAIN === "1" || process.env.MOMENTS_ONCHAIN === "true";

export interface Moment {
  marketId: string;
  imageUri: string;
}

export interface MomentResult {
  onchain: boolean; // true once minted as a cNFT; false = off-chain metadata only (v1 default)
  mintSig?: string;
}

/**
 * Record a market's moment. v1 stores it off-chain (the caller persists the Moment row); the on-chain cNFT mint
 * is gated behind MOMENTS_ONCHAIN and deferred (ADR-032). Kept as one seam so flipping the flag is the only change.
 */
export async function recordMoment(_m: Moment): Promise<MomentResult> {
  if (!MOMENTS_ONCHAIN) return { onchain: false }; // off-chain path — no Bubblegum mint in v1
  // On-chain path (deferred, ADR-032): build + send `mint_moment` (Bubblegum CPI to the prepared tree) once a
  // devnet tree + HELIUS_API_KEY exist, then verify via Helius DAS. Fail loudly rather than silently no-op.
  throw new Error("MOMENTS_ONCHAIN is enabled but on-chain cNFT minting is not yet wired (ADR-032)");
}
