import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { createHash } from "node:crypto";

// txoracle.subscribe(level, weeks) instruction. CLAUDE.md law: only packages/chain builds Solana txs,
// so the TxLINE auth flow (packages/txline) delegates subscribe-tx construction here.
// The subscriber then signs + sends it with the app wallet and hands the signature back to the client.

// Anchor instruction discriminator = sha256("global:<ix>")[0..8].
function anchorDiscriminator(name: string): Buffer {
  return createHash("sha256").update(`global:${name}`).digest().subarray(0, 8);
}

export interface BuildSubscribeInput {
  txoracleProgram: PublicKey; // NETWORKS[cluster].txoracleProgram
  subscriber: PublicKey; // the wallet subscribing (fee payer + signer)
  level: number; // service level (WC26 free tier: 12)
  weeks: number; // subscription length
  subscriptionPda?: PublicKey; // ⚠ Day-0: derive from txoracle IDL; included when known
}

/**
 * Build the `txoracle.subscribe(level, weeks)` instruction.
 * ⚠ Day-0 (TXLINE-MAP §4): arg encoding (level u8 / weeks u16 LE assumed) and the full account list
 * are pending confirmation from the txoracle IDL — extend `keys` with the subscription PDA + system
 * program once verified. The program id + discriminator layout are correct today.
 */
export function buildSubscribeIx(input: BuildSubscribeInput): TransactionInstruction {
  const level = Buffer.alloc(1);
  level.writeUInt8(input.level & 0xff);
  const weeks = Buffer.alloc(2);
  weeks.writeUInt16LE(input.weeks & 0xffff);
  const data = Buffer.concat([anchorDiscriminator("subscribe"), level, weeks]);

  const keys = [{ pubkey: input.subscriber, isSigner: true, isWritable: true }];
  if (input.subscriptionPda) keys.push({ pubkey: input.subscriptionPda, isSigner: false, isWritable: true });

  return new TransactionInstruction({ programId: input.txoracleProgram, keys, data });
}
