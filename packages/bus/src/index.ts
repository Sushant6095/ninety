// ADR-007: one interface, two drivers. Free tier runs Redis Streams; >5k msg/s flips BUS_DRIVER=kafka.
import type { Envelope, Topic } from "@omnipitch/schema";
export interface Bus {
  publish(topic: Topic, key: string, e: Envelope): Promise<void>;
  consume(topic: Topic, group: string, handler: (e: Envelope) => Promise<void>): Promise<void>;
}
export async function createBus(): Promise<Bus> {
  const driver = process.env.BUS_DRIVER ?? "redis";
  if (driver === "kafka") { const { KafkaBus } = await import("./kafka"); return new KafkaBus(); }
  const { RedisBus } = await import("./redis"); return new RedisBus();
}
