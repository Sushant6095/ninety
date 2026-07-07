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
  app.post("/admin/replay", async (req, reply) => {
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
