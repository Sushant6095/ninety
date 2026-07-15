// TxLINE network registry (TXLINE-MAP §0). Each Solana cluster pairs with exactly one
// TxLINE apiOrigin: a devnet subscribe tx must activate on txline-dev, mainnet on txline.
// Mixing them is the footgun this module exists to prevent.

export type Cluster = "devnet" | "mainnet-beta";

export interface TxLineNetwork {
  cluster: Cluster;
  apiOrigin: string;
  txoracleProgram: string; // txoracle program id (subscribe / validateStat)
  txlMint: string; // TxL SPL mint (not needed for WC26 free tier)
}

export const NETWORKS: Record<Cluster, TxLineNetwork> = {
  devnet: {
    cluster: "devnet",
    apiOrigin: "https://txline-dev.txodds.com",
    txoracleProgram: "6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J",
    txlMint: "4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG",
  },
  "mainnet-beta": {
    cluster: "mainnet-beta",
    apiOrigin: "https://txline.txodds.com",
    // Vendored from github.com/txodds/tx-on-chain examples/mainnet (IDL v1.5.6) — ADR-059.
    // MAINNET is the LIVE-DATA network only (SL12 real-time); settlement stays devnet, fail-closed.
    txoracleProgram: "9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA",
    txlMint: "Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL",
  },
};

/** SL tiers are network-bound (ADR-015): devnet free tier is SL1 (60s data delay);
 *  SL12 (real-time) exists only on mainnet — devnet rejects it with InvalidServiceLevelId. */
export const SERVICE_LEVEL: Record<Cluster, number> = { devnet: 1, "mainnet-beta": 12 };

const host = (u: string): string => {
  try {
    return new URL(u).host.toLowerCase();
  } catch {
    return u.toLowerCase();
  }
};

/** Throws unless apiOrigin is the one registered for `cluster`. Prevents cross-network activation. */
export function assertOriginMatchesCluster(apiOrigin: string, cluster: Cluster): void {
  const expected = NETWORKS[cluster];
  if (!expected) throw new Error(`TxLINE: unknown cluster '${cluster}'`);
  if (host(apiOrigin) !== host(expected.apiOrigin)) {
    throw new Error(
      `TxLINE network mismatch: apiOrigin '${apiOrigin}' is not the ${cluster} origin ` +
        `(${expected.apiOrigin}). A devnet subscribe tx must activate on txline-dev, mainnet on ` +
        `txline — never mix networks (TXLINE-MAP §0).`,
    );
  }
}
