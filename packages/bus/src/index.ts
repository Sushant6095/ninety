// ADR-007: one interface, two drivers. Free tier runs Redis Streams; >5k msg/s flips BUS_DRIVER=kafka.
import type { Envelope, SysEvent, Topic } from "@omnipitch/schema";
import { TOPICS } from "@omnipitch/schema";

// The payload carried on a topic is fixed by the topic (ADR-020): system signals (SysEvent) on the sys.*
// plane, domain events (Envelope) everywhere else. Binding payload→topic means a consumer that types its
// handler for the wrong plane fails to compile instead of silently never matching (SysEvent has `kind`,
// not `type`). A broadly-typed Topic (non-literal) falls back to Envelope, the domain default.
// [T] wrapping is non-distributive: a broad `Topic` (union) resolves to Envelope, not Envelope | SysEvent.
export type PayloadOf<T extends Topic> = [T] extends [typeof TOPICS.sysSignals] ? SysEvent : Envelope;

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

// The bus is a typed transport: both communication planes ride the same interface (ADR-020), and the payload
// type is inferred from the topic via PayloadOf<T> — publish(TOPICS.sysSignals, key, sig) requires a SysEvent,
// publish(TOPICS.oddsRaw, key, ev) requires an Envelope. The driver just moves JSON; validation is the caller's.
export interface Bus {
  publish<T extends Topic>(topic: T, key: string, e: PayloadOf<T>): Promise<void>;
  /** Subscribe: resolves once the group exists and the read loop is running (loop runs until close()). */
  consume<T extends Topic>(topic: T, group: string, handler: (e: PayloadOf<T>) => Promise<void>, opts?: ConsumeOptions): Promise<void>;
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
