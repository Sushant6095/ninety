import type { Bus, PayloadOf } from "./index";
import type { Topic } from "@omnipitch/schema";
// Graduation driver (Redpanda Cloud). Same topic names, key = match_id partitioning.
export class KafkaBus implements Bus {
  async publish<T extends Topic>(_t: T, _k: string, _e: PayloadOf<T>) { throw new Error("wire kafkajs when BUS_DRIVER=kafka"); }
  async consume<T extends Topic>(_t: T, _g: string, _h: (e: PayloadOf<T>) => Promise<void>) { throw new Error("wire kafkajs when BUS_DRIVER=kafka"); }
  async close() { /* no-op until kafkajs is wired */ }
}
