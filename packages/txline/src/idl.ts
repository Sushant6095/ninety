import devnetIdl from "../txoracle.json";
import mainnetIdl from "../txoracle.mainnet.json";
import { NETWORKS, type Cluster } from "./network";

// The vendored txoracle IDLs (github.com/txodds/tx-on-chain examples/{devnet,mainnet}/idl) — one per
// network, statically imported (no fs — works under tsx, tsc and bundlers alike). Docs law (ADR-059):
// the loaded IDL's program address MUST equal the network's registered program id, or we throw — an
// IDL/network mismatch is the cross-network footgun, never a warning.

export interface TxoracleIdl {
  address: string;
  metadata?: { name?: string; version?: string };
  instructions: Array<{ name: string; discriminator: number[]; args: unknown[]; accounts: Array<{ name: string }> }>;
}

const IDLS: Record<Cluster, TxoracleIdl> = {
  devnet: devnetIdl as unknown as TxoracleIdl,
  "mainnet-beta": mainnetIdl as unknown as TxoracleIdl,
};

/** The vendored txoracle IDL for a cluster; throws if its address ≠ the network's program id. */
export function loadTxoracleIdl(cluster: Cluster): TxoracleIdl {
  const idl = IDLS[cluster];
  const expected = NETWORKS[cluster].txoracleProgram;
  if (idl.address !== expected) {
    throw new Error(
      `TxLINE IDL/network mismatch: the ${cluster} IDL declares program '${idl.address}' but the ` +
        `network registry expects '${expected}'. RPC, program id, JWT and activation must all be ` +
        `one network (ADR-059) — refusing to continue.`,
    );
  }
  return idl;
}
