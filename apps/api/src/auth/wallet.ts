// Wallet identity (ADR-006 hybrid). EMBEDDED: derive a deterministic ed25519 keypair from email + a server secret
// (custody = the server holds EMBEDDED_WALLET_SECRET; export = hand the user the raw secretKey). EXTERNAL: verify
// the user controls a Phantom-style pubkey by checking an ed25519 signature over a server challenge.
import { createHmac } from "node:crypto";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { embeddedSecret } from "./secrets";

export interface EmbeddedWallet {
  walletPubkey: string; // base58 Solana address
  secretKey: Uint8Array; // 64-byte ed25519 secret (the "export path")
}

/** Deterministic custodial wallet for an email. Same email → same wallet; the server can always regenerate it. */
export function deriveEmbeddedWallet(email: string): EmbeddedWallet {
  const seed = createHmac("sha256", embeddedSecret()).update(email.trim().toLowerCase()).digest(); // 32 bytes
  const kp = nacl.sign.keyPair.fromSeed(seed);
  return { walletPubkey: bs58.encode(kp.publicKey), secretKey: kp.secretKey };
}

/** Verify an external wallet controls `walletPubkey` by checking its ed25519 signature over `message`. */
export function verifyWalletSignature(walletPubkey: string, message: string, signatureBase58: string): boolean {
  try {
    const pub = bs58.decode(walletPubkey);
    const sig = bs58.decode(signatureBase58);
    if (pub.length !== 32 || sig.length !== 64) return false;
    return nacl.sign.detached.verify(new TextEncoder().encode(message), sig, pub);
  } catch {
    return false;
  }
}
