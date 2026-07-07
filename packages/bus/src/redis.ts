import Redis from "ioredis";
import { hostname } from "node:os";
import { randomBytes } from "node:crypto";
import type { Bus, ConsumeOptions, PayloadOf } from "./index";
import type { Envelope, Topic } from "@omnipitch/schema";

// Redis Streams driver (ADR-007). XADD per topic; consumer groups give at-least-once.
// key (match_id) is stored in the entry so ordering-aware consumers can partition.
const MAXLEN = 100_000; // approximate stream trim (~) — bounds memory, keeps ~100k newest
const DEFAULT_BLOCK_MS = 5000;
const DEFAULT_COUNT = 10;
const DEFAULT_MIN_IDLE_MS = 60_000;

// ioredis returns these stream shapes as loosely-typed arrays; model them explicitly.
type StreamEntry = [id: string, fields: string[] | null]; // fields is null for a claimed-but-deleted entry
type XReadGroupReply = Array<[stream: string, entries: StreamEntry[]]> | null;
type XAutoClaimReply = [cursor: string, entries: StreamEntry[], deleted?: string[]];

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class RedisBus implements Bus {
  private readonly url: string;
  private readonly pub: Redis;
  private readonly conns = new Set<Redis>();
  private readonly loops = new Set<Promise<void>>();
  private closing = false;

  constructor(url: string = process.env.REDIS_URL ?? "redis://localhost:6379") {
    this.url = url;
    // maxRetriesPerRequest: null keeps blocking reads (XREADGROUP BLOCK) from timing out as failed requests.
    this.pub = new Redis(url, { maxRetriesPerRequest: null });
  }

  async publish<T extends Topic>(topic: T, key: string, e: PayloadOf<T>): Promise<void> {
    await this.pub.xadd(topic, "MAXLEN", "~", MAXLEN, "*", "key", key, "data", JSON.stringify(e));
  }

  async consume<T extends Topic>(
    topic: T,
    group: string,
    handler: (e: PayloadOf<T>) => Promise<void>,
    opts: ConsumeOptions = {},
  ): Promise<void> {
    // Create at "0": a freshly-created group replays the retained stream, so events
    // published before this consumer joined are still delivered (BUSYGROUP = already exists).
    await this.ensureGroup(topic, group);
    // The transport is untyped JSON; PayloadOf<T> is the caller's compile-time view. Internals stay
    // Envelope-shaped (they only forward the decoded object to the handler), so bridge the handler type here.
    const loop = this.runLoop(topic, group, handler as unknown as (e: Envelope) => Promise<void>, opts);
    this.loops.add(loop);
    void loop.finally(() => this.loops.delete(loop));
  }

  async close(): Promise<void> {
    this.closing = true;
    // Interrupt any blocked XREADGROUP so its loop can observe `closing` and exit.
    for (const c of this.conns) c.disconnect();
    // Bound the wait so an in-flight (hung) handler can't block shutdown forever.
    await Promise.race([Promise.allSettled([...this.loops]), delay(2000)]);
    await this.pub.quit().catch(() => this.pub.disconnect());
  }

  private async ensureGroup(topic: Topic, group: string): Promise<void> {
    try {
      await this.pub.xgroup("CREATE", topic, group, "0", "MKSTREAM");
    } catch (err) {
      if (!(err instanceof Error) || !err.message.includes("BUSYGROUP")) throw err;
    }
  }

  private async runLoop(
    topic: Topic,
    group: string,
    handler: (e: Envelope) => Promise<void>,
    opts: ConsumeOptions,
  ): Promise<void> {
    const consumer = opts.consumer ?? `${hostname()}-${process.pid}-${randomBytes(4).toString("hex")}`;
    const block = opts.blockMs ?? DEFAULT_BLOCK_MS;
    const count = opts.count ?? DEFAULT_COUNT;
    const minIdle = opts.minIdleMs ?? DEFAULT_MIN_IDLE_MS;

    const conn = this.pub.duplicate();
    this.conns.add(conn);
    try {
      while (!this.closing) {
        try {
          // 1) recover entries orphaned by crashed consumers (delivered, unacked, idle > minIdle)
          await this.reclaim(conn, topic, group, consumer, minIdle, count, handler);
          if (this.closing) break;
          // 2) read new entries for this consumer
          const res = (await conn.xreadgroup(
            "GROUP", group, consumer,
            "COUNT", count,
            "BLOCK", block,
            "STREAMS", topic, ">",
          )) as unknown as XReadGroupReply;
          if (!res) continue; // BLOCK elapsed with nothing new
          for (const [, entries] of res) {
            for (const [id, fields] of entries) {
              if (this.closing) break;
              await this.dispatch(conn, topic, group, id, fields, handler);
            }
          }
        } catch (err) {
          if (this.closing) break;
          // Transient error (connection blip) or a throwing handler: leave the entry
          // pending (unacked → redelivered) and back off before retrying.
          await delay(200);
        }
      }
    } finally {
      this.conns.delete(conn);
      conn.disconnect();
    }
  }

  private async reclaim(
    conn: Redis,
    topic: Topic,
    group: string,
    consumer: string,
    minIdle: number,
    count: number,
    handler: (e: Envelope) => Promise<void>,
  ): Promise<void> {
    let cursor = "0-0";
    do {
      const res = (await conn.xautoclaim(
        topic, group, consumer, minIdle, cursor, "COUNT", count,
      )) as unknown as XAutoClaimReply;
      cursor = res[0];
      for (const [id, fields] of res[1] ?? []) {
        if (this.closing) return;
        await this.dispatch(conn, topic, group, id, fields, handler);
      }
    } while (cursor !== "0-0" && !this.closing);
  }

  private async dispatch(
    conn: Redis,
    topic: Topic,
    group: string,
    id: string,
    fields: string[] | null,
    handler: (e: Envelope) => Promise<void>,
  ): Promise<void> {
    const e = fields && decode(fields);
    // Unparseable / tombstoned entry → ack to drop it (never poison-loop the group).
    if (!e) {
      await conn.xack(topic, group, id);
      return;
    }
    await handler(e); // if this throws, the entry stays unacked and is redelivered later
    await conn.xack(topic, group, id);
  }
}

function decode(fields: string[]): Envelope | null {
  const i = fields.indexOf("data");
  if (i < 0 || i + 1 >= fields.length) return null;
  try {
    return JSON.parse(fields[i + 1]) as Envelope;
  } catch {
    return null;
  }
}
