// Transaction builders for the omnipitch_core program (settle, post_root, claim, mint): anchor-discriminator +
// borsh-encoded instruction DATA, a priority-fee helper (ComputeBudget) with a recent-fee estimate, and a
// confirm+retry sender that refreshes the blockhash on expiry. The account metas are the caller's (they know the
// PDAs, ../pdas.ts). Kept dependency-light (@solana/web3.js only); the discriminators are the exported IDL surface.
import { ComputeBudgetProgram, sendAndConfirmTransaction, type Connection, type Keypair, type PublicKey, type Transaction, type TransactionInstruction } from "@solana/web3.js";
import { anchorDiscriminator } from "./helius";

// --- priority fee ---
export function priorityFeeIxs(microLamportsPerCu: number, computeUnitLimit: number): TransactionInstruction[] {
  return [ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnitLimit }), ComputeBudgetProgram.setComputeUnitPrice({ microLamports: microLamportsPerCu })];
}

/** Estimate a priority fee from recent prioritization fees (75th pct), floored. Never throws. */
export async function estimatePriorityFee(connection: Connection, lockedWritableAccounts: PublicKey[], floor = 1000): Promise<number> {
  try {
    const recent = await connection.getRecentPrioritizationFees({ lockedWritableAccounts });
    const fees = recent.map((r) => r.prioritizationFee).filter((f) => f > 0).sort((a, b) => a - b);
    return fees.length ? Math.max(floor, fees[Math.floor(fees.length * 0.75)]) : floor;
  } catch {
    return floor;
  }
}

// --- minimal borsh encoders (LE) ---
const u8 = (n: number): Buffer => Buffer.from([n & 0xff]);
const u32 = (n: number): Buffer => { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; };
const u64 = (n: bigint | number): Buffer => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b; };
const bytesVec = (buf: Buffer): Buffer => Buffer.concat([u32(buf.length), buf]); // Vec<u8>
const str = (s: string): Buffer => { const b = Buffer.from(s, "utf8"); return Buffer.concat([u32(b.length), b]); };
const vec32 = (items: Uint8Array[]): Buffer => Buffer.concat([u32(items.length), ...items.map((i) => Buffer.from(i))]); // Vec<[u8;32]>

const ixData = (name: string, ...args: Buffer[]): Buffer => Buffer.concat([anchorDiscriminator(name), ...args]);

// Exported instruction-data encoders (the typed IDL surface). result: 1=H 2=D 3=A.
export const settleData = (result: number, proof: Buffer): Buffer => ixData("settle_market", u8(result), bytesVec(proof));
export const postRootData = (epoch: number, root: Uint8Array): Buffer => ixData("post_leaderboard_root", u32(epoch), Buffer.from(root));
export const claimData = (epoch: number, amount: bigint | number, merkleProof: Uint8Array[]): Buffer => ixData("claim_points", u32(epoch), u64(amount), vec32(merkleProof));
export const mintData = (metadataUri: string): Buffer => ixData("mint_moment", str(metadataUri));

/** Send + confirm with retry: on failure, refresh the blockhash and re-send (bounded). Throws the last error. */
export async function sendWithRetry(connection: Connection, tx: Transaction, signers: Keypair[], retries = 3): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await sendAndConfirmTransaction(connection, tx, signers, { commitment: "confirmed", maxRetries: 3 });
    } catch (err) {
      lastErr = err;
      const { blockhash } = await connection.getLatestBlockhash("confirmed"); // expiry → fresh blockhash, retry
      tx.recentBlockhash = blockhash;
    }
  }
  throw lastErr;
}
