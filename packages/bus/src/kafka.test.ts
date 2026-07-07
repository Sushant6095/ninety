import { describe, it, expect } from "vitest";
import { KafkaBus } from "./kafka";
import { TOPICS } from "@omnipitch/schema";
import type { Bus } from "./index";
import type { Envelope } from "@omnipitch/schema";

// KafkaBus is the graduation driver — it conforms to the Bus interface but is not wired yet.
// (Conformance is also proven at compile time by Conforms<KafkaBus> in contract.ts.)
describe("KafkaBus (stub)", () => {
  // Assigning to Bus is the runtime side of the conformance check; constructing opens no connection.
  const bus: Bus = new KafkaBus();

  it("throws on publish until kafkajs is wired", async () => {
    await expect(bus.publish(TOPICS.orders, "m", {} as unknown as Envelope)).rejects.toThrow(/kafka/i);
  });

  it("throws on consume until kafkajs is wired", async () => {
    await expect(bus.consume(TOPICS.orders, "g", async () => {})).rejects.toThrow(/kafka/i);
  });

  it("has a safe no-op close()", async () => {
    await expect(bus.close()).resolves.toBeUndefined();
  });
});
