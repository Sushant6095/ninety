// Moment = biggest swing per match → render the swing card (ADR-040) → upload → write a Moment row → (optionally)
// mint a cNFT. MOMENTS_ONCHAIN gates the on-chain Bubblegum cNFT mint (programs/omnipitch_core `mint_moment`).
//
// CUT STANDS for v1 (ADR-032, re-confirmed ADR-041): the swing-card PNG/SVG pipeline is now built (ADR-040), but the
// on-chain half's blockers are UNCHANGED — HELIUS_API_KEY is unset and no devnet Bubblegum concurrent-merkle tree is
// provisioned, so the DAS VERIFY can't run (>half-a-day of external setup for a cosmetic feature). MOMENTS_ONCHAIN
// therefore defaults OFF: moments ship PNG-only (the Moment table / imageUri). Flip it on once a tree + HELIUS_API_KEY
// exist and the mint tx (chain pkg `mintData` + a signer/connection) is wired; then verify via Helius DAS.
import { buildMoment, type MomentDeps } from "./swing-card";
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
export async function recordMoment(m: Moment): Promise<MomentResult> {
  if (!MOMENTS_ONCHAIN) return { onchain: false }; // off-chain path — the PNG/SVG card IS the moment (v1 default)
  // On-chain path (deferred, ADR-041): build + send `mint_moment` (chain `mintData(m.imageUri)` as metadata_uri →
  // Bubblegum CPI to the prepared tree) once a devnet tree + HELIUS_API_KEY exist, then verify via Helius DAS.
  // Fail loudly rather than silently no-op so an operator who flips the flag prematurely sees the missing wiring.
  throw new Error(`MOMENTS_ONCHAIN enabled but on-chain cNFT minting is not wired (no tree/HELIUS_API_KEY; ADR-041). imageUri=${m.imageUri}`);
}

/**
 * The saga MOMENTS step body. Always builds the swing-card moment (ADR-040, PNG-only in v1). When MOMENTS_ONCHAIN is
 * on it additionally mints via recordMoment and returns the sig. The PNG row is written by buildMoment BEFORE any
 * mint, so a mint failure (currently: unwired) never loses the moment. Returns null when the match had no swing.
 */
export async function runMomentsStep(marketId: string, deps: MomentDeps): Promise<(MomentResult & { imageUri: string }) | null> {
  const row = await buildMoment(marketId, deps); // pick swing → render → upload → Moment row
  if (!row) return null; // flat match — no card
  const minted = await recordMoment({ marketId, imageUri: row.imageUri }); // off → {onchain:false}; on → mint (blocked)
  return { ...minted, imageUri: row.imageUri };
}
