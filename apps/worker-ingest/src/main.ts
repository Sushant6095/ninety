// L1 ingest worker. Always runs the REPLAY SERVICE (replay_request signals → archived buckets through
// the real topics, ADR-020/021 — demo insurance without live auth). With TXLINE_NETWORK set it ALSO
// runs LIVE ingest against that network (ADR-059: mainnet = SL12 real-time data; devnet = SL1 delayed
// dev tier). Live auth reuses the human-purchased subscription — reuseSubscriber never sends a
// transaction and keypairSigner only signs activation messages; ingest can never spend SOL.
import { createBus } from "@omnipitch/bus";
import { TxLineClient, loadTxoracleIdl, type Cluster } from "@omnipitch/txline";
import { startReplayService } from "./replayer";
import { runIngest, type RunIngestHandle } from "./ingest";
import { reuseSubscriber, devnetFreshSubscriber, keypairSigner, initialAuthFromEnv } from "./liveAuth";

function liveCluster(): Cluster | null {
  const raw = process.env.TXLINE_NETWORK?.trim().toLowerCase();
  if (!raw) return null;
  if (raw === "mainnet" || raw === "mainnet-beta") return "mainnet-beta";
  if (raw === "devnet") return "devnet";
  throw new Error(`TXLINE_NETWORK='${raw}' — expected 'mainnet' or 'devnet'`);
}

async function main() {
  const bus = await createBus();
  const mgr = await startReplayService(bus);
  console.log(JSON.stringify({ evt: "worker-ingest.replay.ready" }));

  let live: RunIngestHandle | null = null;
  const cluster = liveCluster();
  if (cluster) {
    loadTxoracleIdl(cluster); // ADR-059 guard: IDL address must match the network registry, or throw
    // devnet: a txSig activates once → fresh subscribe per handshake (free SOL); mainnet: reuse the
    // human-purchased subscription, never spend. Persisted tokens seed the session either way, so a
    // boot right after the subscribe script never re-burns an activation.
    const client = new TxLineClient({
      cluster,
      subscriber: cluster === "devnet" ? devnetFreshSubscriber() : reuseSubscriber(cluster),
      signer: keypairSigner(cluster),
      initialAuth: initialAuthFromEnv(cluster),
    });
    live = await runIngest(client, bus);
    console.log(JSON.stringify({ evt: "worker-ingest.live.ready", cluster }));
  }

  const shutdown = async () => {
    await live?.stop();
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
