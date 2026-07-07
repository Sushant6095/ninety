// ADR-007: one interface, two drivers. Free tier runs Redis Streams; >5k msg/s flips BUS_DRIVER=kafka.
import type { Envelope, Topic } from "@omnipitch/schema";

export interface ConsumeOptions {
  /** Consumer name within the group. Defaults to a unique per-process id. */
  consumer?: string;
  /** XREADGROUP block timeout in ms (0 = block forever). Default 5000. */
  blockMs?: number;
  /** Max entries per read / reclaim batch. Default 10. */
  count?: number;
  /** Min idle before a crashed consumer's pending entry is reclaimed via XAUTOCLAIM, in ms. Default 60000. */
  minIdleMs?: number;
}

export interface Bus {
  publish(topic: Topic, key: string, e: Envelope): Promise<void>;
  /** Subscribe: resolves once the group exists and the read loop is running (loop runs until close()). */
  consume(topic: Topic, group: string, handler: (e: Envelope) => Promise<void>, opts?: ConsumeOptions): Promise<void>;
  /** Graceful shutdown: stop every consume loop and close connections. */
  close(): Promise<void>;
}

export async function createBus(): Promise<Bus> {
  const driver = process.env.BUS_DRIVER ?? "redis";
  if (driver === "kafka") {
    const { KafkaBus } = await import("./kafka");
    return new KafkaBus();
  }
  const { RedisBus } = await import("./redis");
  return new RedisBus();
}
