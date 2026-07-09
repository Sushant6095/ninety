// LIVE backend verify — runs the real read-models + WS bridge mapping against the REAL Redis + bus.
// No Prisma / DATABASE_URL needed (the security hook gates .env), so this proves the hot path + read caches
// end-to-end without touching secrets. Run: pnpm --filter @omnipitch/api exec tsx scripts/verify-live.ts
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createBus } from "@omnipitch/bus";
import { TOPICS, type Envelope } from "@omnipitch/schema";
import { redis } from "../src/redis";
import { startMarketsRead, getMark, getMarks, MARK_KEY } from "../src/services/markets-read";
import { getLeaderboard } from "../src/services/leaderboard";
import { LB_KEY } from "../src/services/projection";
import { attachBridge, startWs, type Frame } from "../src/ws/gateway";

const OUT = "../../docs/api-samples";
const MATCH = "wc26-can-mar";
const MARKET = "wc26-can-mar:1x2";
const nowIso = () => new Date().toISOString();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const markEnvelope = (fair: Record<string, number>): Envelope => ({
  event_id: randomUUID(), source: "cortex", source_seq: Date.now(), match_id: MATCH, market_id: MARKET,
  ts_source: nowIso(), ts_ingest: nowIso(), type: "mark", payload: { market_id: MARKET, fair, hazard: 0.4, b_hint: 420 },
});

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, detail = "") => { console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`); ok ? pass++ : fail++; };

async function main() {
  await mkdir(OUT, { recursive: true });
  await redis.del(MARK_KEY(MARKET), LB_KEY);
  const bus = await createBus();
  await startMarketsRead(bus, redis);

  // 1) marks read-model: publish a REAL mark → it lands in Redis market:{id}
  await bus.publish(TOPICS.pricesMarks, MATCH, markEnvelope({ H: 0.614, D: 0.221, A: 0.165 }));
  let mark = null;
  for (let i = 0; i < 40 && !mark; i++) { await sleep(50); mark = await getMark(redis, MARKET); }
  check("marks read-model: prices.marks → Redis market:{id}", !!mark && Math.abs((mark!.fair.H ?? 0) - 0.614) < 1e-9, mark ? `H=${mark.fair.H} b=${mark.bHint}` : "no mark");
  check("marks batch read (getMarks)", (await getMarks(redis, [MARKET, "missing:market"])).size === 1);
  if (mark) await writeFile(`${OUT}/market-mark.json`, JSON.stringify(mark, null, 2));

  // 2) leaderboard read: seed the real zset the projection writes → getLeaderboard ranks it
  await redis.zadd(LB_KEY, "2431", "hexfan", "1876", "maple_maxi", "980", "sofia_g");
  const lb = await getLeaderboard(redis, 10);
  check("leaderboard: lb:global zset → ranked rows", lb.length === 3 && lb[0].userId === "hexfan" && lb[0].rank === 1 && lb[0].pnl === 2431, JSON.stringify(lb[0]));
  await writeFile(`${OUT}/leaderboard.json`, JSON.stringify({ leaderboard: lb }, null, 2));

  // 3) WS bridge MAPPING: real prices.marks → a seq'd frame on m:{match}:prices (transport-agnostic, via attachBridge).
  const frames: Array<{ f: Frame; at: number }> = [];
  await attachBridge(bus, (_ch, f) => frames.push({ f, at: Date.now() }));
  await sleep(200);
  frames.length = 0; // ignore backlog; measure the next live tick
  const sentAt = Date.now();
  await bus.publish(TOPICS.pricesMarks, MATCH, markEnvelope({ H: 0.64, D: 0.21, A: 0.15 }));
  let hit: { f: Frame; at: number } | undefined;
  for (let i = 0; i < 40 && !hit; i++) { await sleep(50); hit = frames.find((x) => x.f.ch === `m:${MATCH}:prices` && (x.f.d as { fair?: Record<string, number> }).fair?.H === 0.64); }
  check("WS bridge: prices.marks → m:{match}:prices frame w/ seq", !!hit && typeof hit.f.seq === "number", hit ? `seq=${hit.f.seq} ${hit.at - sentAt}ms` : "no frame");
  check("WS frame sub-second", !!hit && hit.at - sentAt < 1000, hit ? `${hit.at - sentAt}ms` : "n/a");
  if (hit) await writeFile(`${OUT}/ws-prices-frame.json`, JSON.stringify(hit.f, null, 2));

  // uWS transport availability (INFO — not pass/fail; it ships binaries for Node 16/18/20, this env is newer).
  const ws = await startWs(bus);
  console.log(ws ? "ℹ uWS transport: listening on 4001" : "ℹ uWS transport: unavailable on this Node runtime (bridge verified above); run the API on Node 18/20 for the live socket");
  ws?.stop();

  await bus.close();
  await redis.quit();
  console.log(`\n${fail === 0 ? "ALL GREEN" : "FAILED"} — ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error("verify crashed:", e); process.exit(1); });
