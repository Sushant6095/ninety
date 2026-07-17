// REST admin routes. Never touches engine state directly — POST /admin/replay publishes a replay_request
// system signal (ADR-020/021) onto the bus; worker-ingest consumes it and runs the fixture replay.
import type { FastifyInstance } from "fastify";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { TOPICS, type SysEvent } from "@omnipitch/schema";
import type { Bus } from "@omnipitch/bus";

// Admin gate. Unset ADMIN_TOKEN → every admin call is rejected (secure default; no open admin surface).
// Constant-time compare so the token can't be recovered byte-by-byte via response timing.
function tokenOk(provided: unknown): boolean {
  const expected = process.env.ADMIN_TOKEN ?? "";
  if (!expected || typeof provided !== "string") return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function registerAdminRoutes(app: FastifyInstance, bus: Bus): void {
  // POST /admin/replay {match_id, speed} → replay a finished fixture through the ingest plane at Nx.
  // Play-money law: replay only re-publishes historical events; it never mints credits or settles.
  app.post("/admin/replay", {
    schema: {
      tags: ["system"],
      summary: "Replay a finished fixture",
      description: "Admin-gated by the `x-admin-token` header (constant-time compared to ADMIN_TOKEN; unset → every call is rejected). Publishes a replay_request onto the system plane; worker-ingest runs the replay. Play-money law: replay only re-publishes historical events — it never mints credits or settles.",
      body: { type: "object", additionalProperties: true, properties: { match_id: { type: "string" }, speed: { type: "number", description: "replay speed multiplier (default 10)" } } },
      response: {
        202: { type: "object", additionalProperties: true, properties: { accepted: { type: "boolean" }, match_id: { type: "string" }, speed: { type: "number" } } },
        400: { type: "object", additionalProperties: true, properties: { error: { type: "string" } } },
        401: { type: "object", additionalProperties: true, properties: { error: { type: "string" } } },
      },
    },
  }, async (req, reply) => {
    if (!tokenOk(req.headers["x-admin-token"])) return reply.code(401).send({ error: "unauthorized" });

    const body = (req.body ?? {}) as { match_id?: unknown; speed?: unknown };
    const matchId = typeof body.match_id === "string" ? body.match_id.trim() : "";
    const speed = Number(body.speed ?? 10);
    if (!matchId) return reply.code(400).send({ error: "match_id required" });
    if (!Number.isFinite(speed) || speed <= 0) return reply.code(400).send({ error: "speed must be a positive number" });

    const sig: SysEvent = {
      sig_id: randomUUID(),
      ts: new Date().toISOString(),
      severity: "info",
      kind: "replay_request",
      payload: { match_id: matchId, speed },
    };
    await bus.publish(TOPICS.sysSignals, matchId, sig);
    return reply.code(202).send({ accepted: true, match_id: matchId, speed });
  });
}
