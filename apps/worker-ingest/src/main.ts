// L1: TxLINE → normalize → bus. NO business logic. Streams: odds (StablePrice), score events; polled: fixtures.
// This entrypoint runs the REPLAY loop (archived samples → pipeline → bus) — a runnable dev loop with no
// live auth. LIVE mode wires a chain-backed TxLineClient (subscriber+signer, see scripts/txline-live.mjs)
// and calls runIngest(client, bus); it's kept out of this app to honor "only chain builds Solana txs".
import Redis from "ioredis";
import { createBus } from "@omnipitch/bus";
import { createPipeline } from "./ingest";
import { replay } from "./replayer";

async function main() {
  const bus = await createBus();
  const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
  const pipe = createPipeline(bus, redis, { logEvery: 100 });
  await replay(pipe); // archived odds → odds.raw, scores → match.events, deduped by (source, source_seq)
  console.log(JSON.stringify({ evt: "ingest.replay.done", ...pipe.stats }));
  await redis.quit().catch(() => redis.disconnect());
  await bus.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
