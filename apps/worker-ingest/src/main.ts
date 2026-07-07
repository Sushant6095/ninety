// L1 ingest worker. LIVE mode wires a chain-backed TxLineClient (subscriber+signer, see scripts/txline-live.mjs)
// and calls runIngest(client, bus) — kept out of this entrypoint to honor "only chain builds Solana txs".
// This entrypoint runs the REPLAY SERVICE: it consumes replay_request signals off the bus system plane
// (ADR-020/021) and replays a finished fixture's archived buckets through the SAME topics at Nx, isolated by
// match_id. Demo insurance + backtests without live auth. (Archived one-shot smoke: replay() in replayer.ts.)
import { createBus } from "@omnipitch/bus";
import { startReplayService } from "./replayer";

async function main() {
  const bus = await createBus();
  const mgr = await startReplayService(bus);
  console.log(JSON.stringify({ evt: "worker-ingest.replay.ready" }));

  const shutdown = async () => {
    await mgr.stopAll();
    await bus.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
