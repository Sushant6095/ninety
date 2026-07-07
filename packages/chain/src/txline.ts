import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";

// txoracle.subscribe(service_level_id, weeks) — built from the on-chain IDL (packages/txline/txoracle.json,
// program 6pW64gN1…, v1.4.2) and verified LIVE on devnet (ADR-015). CLAUDE.md law: only packages/chain
// builds Solana txs, so packages/txline's auth flow delegates subscribe-tx construction here.

export const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
// authoritative discriminator from the IDL (NOT sha256("global:subscribe"))
const SUBSCRIBE_DISCRIMINATOR = Buffer.from([254, 28, 191, 138, 156, 179, 183, 53]);

/** Token-2022 associated token account for (mint, owner). */
function ata(mint: PublicKey, owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([owner.toBuffer(), TOKEN_2022_PROGRAM_ID.toBuffer(), mint.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID)[0];
}

export interface SubscribeAccounts {
  pricingMatrix: PublicKey;
  tokenTreasuryPda: PublicKey;
  tokenTreasuryVault: PublicKey;
  userTokenAccount: PublicKey;
}

/** Derive the shared subscribe accounts (PDAs + Token-2022 ATAs) for a wallet. */
export function deriveSubscribeAccounts(txoracleProgram: PublicKey, txlMint: PublicKey, user: PublicKey): SubscribeAccounts {
  const [pricingMatrix] = PublicKey.findProgramAddressSync([Buffer.from("pricing_matrix")], txoracleProgram);
  const [tokenTreasuryPda] = PublicKey.findProgramAddressSync([Buffer.from("token_treasury_v2")], txoracleProgram);
  return {
    pricingMatrix,
    tokenTreasuryPda,
    tokenTreasuryVault: ata(txlMint, tokenTreasuryPda),
    userTokenAccount: ata(txlMint, user),
  };
}

export interface BuildSubscribeInput {
  txoracleProgram: PublicKey;
  txlMint: PublicKey;
  user: PublicKey; // fee payer + signer
  serviceLevelId: number; // devnet free tier: 1 (60s delay); mainnet real-time: 12
  weeks: number;
}

/** Build the `subscribe(service_level_id: u16, weeks: u8)` instruction (9 accounts in IDL order). */
export function buildSubscribeIx(input: BuildSubscribeInput): TransactionInstruction {
  const a = deriveSubscribeAccounts(input.txoracleProgram, input.txlMint, input.user);
  const args = Buffer.alloc(3);
  args.writeUInt16LE(input.serviceLevelId & 0xffff, 0);
  args.writeUInt8(input.weeks & 0xff, 2);
  return new TransactionInstruction({
    programId: input.txoracleProgram,
    keys: [
      { pubkey: input.user, isSigner: true, isWritable: true },
      { pubkey: a.pricingMatrix, isSigner: false, isWritable: false },
      { pubkey: input.txlMint, isSigner: false, isWritable: false },
      { pubkey: a.userTokenAccount, isSigner: false, isWritable: true },
      { pubkey: a.tokenTreasuryVault, isSigner: false, isWritable: true },
      { pubkey: a.tokenTreasuryPda, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.concat([SUBSCRIBE_DISCRIMINATOR, args]),
  });
}

/**
 * The user's Token-2022 ATA for the TxL mint must exist before `subscribe` (the program does not create
 * it — verified live: AccountNotInitialized otherwise). Prepend this idempotent create to the subscribe tx.
 */
export function buildCreateUserAtaIx(txlMint: PublicKey, user: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: user, isSigner: true, isWritable: true }, // payer
      { pubkey: ata(txlMint, user), isSigner: false, isWritable: true }, // ata to create
      { pubkey: user, isSigner: false, isWritable: false }, // owner
      { pubkey: txlMint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([1]), // createIdempotent
  });
}
