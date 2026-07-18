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
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { NETWORKS, SERVICE_LEVEL, type Cluster } from "@omnipitch/txline";
import { buildSubscribeIx, buildCreateUserAtaIx } from "@omnipitch/chain";

const ENV_KEYS: Record<Cluster, { txSig: string; keypair: string; jwt: string; apiToken: string }> = {
  devnet: { txSig: "TXLINE_DEVNET_TX_SIG", keypair: "TXLINE_DEVNET_KEYPAIR_PATH", jwt: "TXLINE_DEVNET_JWT", apiToken: "TXLINE_DEVNET_API_TOKEN" },
  "mainnet-beta": { txSig: "TXLINE_MAINNET_TX_SIG", keypair: "TXLINE_MAINNET_KEYPAIR_PATH", jwt: "TXLINE_MAINNET_JWT", apiToken: "TXLINE_MAINNET_API_TOKEN" },
};

/** Persisted session from the subscribe script, if present. On devnet a txSig activates exactly
 *  ONCE — booting without these would burn the activation the script already spent. env carries no
 *  timestamp, so the session is assumed fresh; a stale one just 401s and the refresh path runs. */
export function initialAuthFromEnv(cluster: Cluster): { jwt: string; apiToken: string } | undefined {
  const k = ENV_KEYS[cluster];
  const jwt = process.env[k.jwt];
  const apiToken = process.env[k.apiToken];
  return jwt && apiToken ? { jwt, apiToken } : undefined;
}

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

/** Devnet-only: sends a FRESH subscribe tx per handshake. A devnet txSig activates exactly once, so
 *  the reuse pattern cannot refresh a session there — and devnet SOL is free, so the ADR-059
 *  automation-never-spends law (a MAINNET law, real money) does not apply. Builders come from
 *  packages/chain (the only tx-building home); this function only signs and sends. */
export function devnetFreshSubscriber(): { subscribe(input: { level: number; weeks: number }): Promise<string> } {
  return {
    async subscribe({ level, weeks }): Promise<string> {
      const kp = Keypair.fromSecretKey(loadSecretKey("devnet"));
      const net = NETWORKS.devnet;
      const conn = new Connection(process.env.TXLINE_DEVNET_RPC_URL ?? "https://api.devnet.solana.com", "confirmed");
      const mint = new PublicKey(net.txlMint);
      const tx = new Transaction()
        .add(buildCreateUserAtaIx(mint, kp.publicKey))
        .add(buildSubscribeIx({ txoracleProgram: new PublicKey(net.txoracleProgram), txlMint: mint, user: kp.publicKey, serviceLevelId: level ?? SERVICE_LEVEL.devnet, weeks }));
      tx.feePayer = kp.publicKey;
      tx.recentBlockhash = (await conn.getLatestBlockhash("confirmed")).blockhash;
      tx.sign(kp);
      const sig = await conn.sendRawTransaction(tx.serialize(), { preflightCommitment: "confirmed" });
      await conn.confirmTransaction(sig, "confirmed");
      console.log(JSON.stringify({ evt: "ingest.devnet.subscribe", sig }));
      return sig;
    },
  };
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

/** ed25519 message signer over the subscribing wallet (node crypto; base64 detached signature).
 *  LAZY (ADR-079): the keypair file is read on first sign()/publicKey use, NOT at construction — so a
 *  token-only boot (initialAuth present → TxLineClient reuses the session, never re-signs) never seeks
 *  id.json. Reading eagerly here is what crash-looped devnet ingest on Fly without the wallet mounted. */
export function keypairSigner(cluster: Cluster): { publicKey: string; sign(message: string): Promise<string> } {
  let keys: { publicKey: string; privateKey: ReturnType<typeof createPrivateKey> } | null = null;
  const load = () => {
    if (keys) return keys;
    const secret = loadSecretKey(cluster);
    const privateKey = createPrivateKey({
      key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(secret.slice(0, 32))]),
      format: "der",
      type: "pkcs8",
    });
    const pub = createPublicKey(privateKey).export({ format: "der", type: "spki" }).subarray(-32);
    keys = { publicKey: Buffer.from(pub).toString("base64"), privateKey };
    return keys;
  };
  return {
    get publicKey() {
      return load().publicKey;
    },
    async sign(message: string): Promise<string> {
      return edSign(null, Buffer.from(message), load().privateKey).toString("base64");
    },
  };
}
