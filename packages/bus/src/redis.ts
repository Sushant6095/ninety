import Redis from "ioredis";
import type { Bus } from "./index";
import type { Envelope, Topic } from "@omnipitch/schema";
// XADD per topic; consumer groups give at-least-once. Key (match_id) preserved in the entry for ordering-aware consumers.
export class RedisBus implements Bus {
  private r = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
  async publish(topic: Topic, key: string, e: Envelope) { await this.r.xadd(topic, "*", "key", key, "data", JSON.stringify(e)); }
  async consume(topic: Topic, group: string, handler: (e: Envelope) => Promise<void>) {
    try { await this.r.xgroup("CREATE", topic, group, "$", "MKSTREAM"); } catch { /* exists */ }
    // loop: XREADGROUP → handler → XACK  (left as day-1 implementation)
    void handler;
  }
}
