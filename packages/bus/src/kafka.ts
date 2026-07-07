import type { Bus } from "./index";
import type { Envelope, Topic } from "@omnipitch/schema";
// Graduation driver (Redpanda Cloud). Same topic names, key = match_id partitioning.
export class KafkaBus implements Bus {
  async publish(_t: Topic, _k: string, _e: Envelope) { throw new Error("wire kafkajs when BUS_DRIVER=kafka"); }
  async consume() { throw new Error("wire kafkajs when BUS_DRIVER=kafka"); }
  async close() { /* no-op until kafkajs is wired */ }
}
