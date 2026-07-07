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
    txoracleProgram: "", // ⚠ Day-0: confirm mainnet program id + mint before mainnet use
    txlMint: "",
  },
};

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
