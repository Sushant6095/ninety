// Live-mode auth wiring for the TxLineClient (ADR-059). Two rules make this safe to run anywhere:
//   1. The Subscriber NEVER sends an on-chain transaction — it returns the SAVED subscribe txSig from
//      env (the human bought the subscription via scripts/txline-mainnet-subscribe.mjs). If it's
//      missing we throw with instructions; ingest can never spend SOL.
//   2. The signer does MESSAGE signing only (ed25519 over "{txSig}:{leagues}:{jwt}") with the wallet
//      that subscribed — costless, no transaction, required because each fresh guest JWT must be
//      re-signed to re-activate against the same subscription.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { createPrivateKey, sign as edSign, createPublicKey } from "node:crypto";
import type { Cluster } from "@omnipitch/txline";

const ENV_KEYS: Record<Cluster, { txSig: string; keypair: string }> = {
  devnet: { txSig: "TXLINE_DEVNET_TX_SIG", keypair: "TXLINE_DEVNET_KEYPAIR_PATH" },
  "mainnet-beta": { txSig: "TXLINE_MAINNET_TX_SIG", keypair: "TXLINE_MAINNET_KEYPAIR_PATH" },
};

function loadSecretKey(cluster: Cluster): Uint8Array {
  const key = ENV_KEYS[cluster].keypair;
  const fallback = cluster === "devnet" ? `${homedir()}/.config/solana/id.json` : undefined;
  const path = process.env[key] ?? fallback;
  if (!path) {
    throw new Error(
      `${key} is not set. Live ${cluster} ingest re-signs activation messages with the wallet that ` +
        `subscribed (message signing only — no transactions). Point it at that keypair JSON.`,
    );
  }
  return Uint8Array.from(JSON.parse(readFileSync(path.replace(/^~/, homedir()), "utf8")) as number[]);
}

/** Subscriber that reuses the human-purchased subscription — never builds or sends a transaction. */
export function reuseSubscriber(cluster: Cluster): { subscribe(): Promise<string> } {
  return {
    async subscribe(): Promise<string> {
      const key = ENV_KEYS[cluster].txSig;
      const sig = process.env[key];
      if (!sig) {
        throw new Error(
          `${key} is not set — there is no saved ${cluster} subscription. Run ` +
            `scripts/txline-mainnet-subscribe.mjs with YOUR funded wallet first (ADR-059: automation ` +
            `never spends SOL).`,
        );
      }
      return sig;
    },
  };
}

/** ed25519 message signer over the subscribing wallet (node crypto; base64 detached signature). */
export function keypairSigner(cluster: Cluster): { publicKey: string; sign(message: string): Promise<string> } {
  const secret = loadSecretKey(cluster);
  const privateKey = createPrivateKey({
    key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(secret.slice(0, 32))]),
    format: "der",
    type: "pkcs8",
  });
  const publicKey = createPublicKey(privateKey).export({ format: "der", type: "spki" }).subarray(-32);
  return {
    publicKey: Buffer.from(publicKey).toString("base64"),
    async sign(message: string): Promise<string> {
      return edSign(null, Buffer.from(message), privateKey).toString("base64");
    },
  };
}
