import { describe, it, expect } from "vitest";
import Fastify from "fastify";
import type { Bus } from "@omnipitch/bus";
import { TOPICS, parseSysEvent } from "@omnipitch/schema";
import { registerAdminRoutes } from "./admin";

function mockBus() {
  const published: { topic: string; key: string; sig: unknown }[] = [];
  const bus: Bus = {
    publish: async (topic, key, sig) => void published.push({ topic: topic as string, key, sig }),
    consume: async () => {},
    close: async () => {},
  };
  return { bus, published };
}

const app = (bus: Bus) => {
  const a = Fastify();
  registerAdminRoutes(a, bus);
  return a;
};
const post = (a: ReturnType<typeof Fastify>, headers: Record<string, string>, payload: unknown) =>
  a.inject({ method: "POST", url: "/admin/replay", headers: { "content-type": "application/json", ...headers }, payload });

describe("POST /admin/replay", () => {
  it("rejects without the admin token (401)", async () => {
    process.env.ADMIN_TOKEN = "secret";
    const { bus, published } = mockBus();
    const res = await post(app(bus), {}, { match_id: "18193785", speed: 10 });
    expect(res.statusCode).toBe(401);
    expect(published).toHaveLength(0); // nothing published on an unauthorized call
  });

  it("publishes a valid replay_request signal with the token (202)", async () => {
    process.env.ADMIN_TOKEN = "secret";
    const { bus, published } = mockBus();
    const res = await post(app(bus), { "x-admin-token": "secret" }, { match_id: "18193785", speed: 10 });
    expect(res.statusCode).toBe(202);
    expect(published).toHaveLength(1);
    expect(published[0].topic).toBe(TOPICS.sysSignals); // system plane, not a domain topic
    expect(published[0].key).toBe("18193785");
    const sig = parseSysEvent(published[0].sig); // it is a schema-valid SysEvent
    expect(sig.kind).toBe("replay_request");
    if (sig.kind !== "replay_request") throw new Error("expected replay_request");
    expect(sig.payload).toEqual({ match_id: "18193785", speed: 10 });
  });

  it("400s on a non-positive speed", async () => {
    process.env.ADMIN_TOKEN = "secret";
    const { bus } = mockBus();
    const res = await post(app(bus), { "x-admin-token": "secret" }, { match_id: "18193785", speed: -1 });
    expect(res.statusCode).toBe(400);
  });
});
