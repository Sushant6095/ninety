import { describe, it, expect } from "vitest";
import Fastify from "fastify";
import type { Bus } from "@omnipitch/bus";
import { registerWebhookRoutes } from "./webhooks";

const noopBus = { publish: async () => {}, consume: async () => {}, close: async () => {} } as unknown as Bus;

describe("POST /webhooks/helius (prompt 23)", () => {
  it("rejects a missing/bad secret (401) and accepts a valid secret (empty batch → no DB writes)", async () => {
    process.env.HELIUS_WEBHOOK_SECRET = "test-secret";
    const app = Fastify();
    registerWebhookRoutes(app, noopBus);

    const bad = await app.inject({ method: "POST", url: "/webhooks/helius", payload: [] });
    expect(bad.statusCode).toBe(401);

    const wrong = await app.inject({ method: "POST", url: "/webhooks/helius", headers: { authorization: "nope" }, payload: [] });
    expect(wrong.statusCode).toBe(401);

    const ok = await app.inject({ method: "POST", url: "/webhooks/helius", headers: { authorization: "test-secret" }, payload: [] });
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toMatchObject({ ok: true, chainEvents: 0, settled: 0 }); // empty batch never touches Postgres
    await app.close();
  });
});
