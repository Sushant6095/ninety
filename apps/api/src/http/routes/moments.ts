// REST routes for moments (ADR-072). A Moment is a biggest-swing card — the picture of the instant a match's
// price lurched — optionally minted as a Solana cNFT (mintSig is the on-chain proof). Reads Postgres only; NEVER
// touches engine state (orders go through the engine queue). Play-money: a moment is a keepsake, not a position.
import type { FastifyInstance } from "fastify";
import type { Moment, Market, Match } from "@prisma/client";
import { prisma } from "../../db";

type MomentWithCtx = Moment & { market: Market & { match: Match } };

// The moment view the frontend consumes. `mintSig` is returned RAW (the frontend builds the Solscan URL, exactly
// as markets.ts returns settleSig raw) — and it is null until minted, so the UI never renders a dead proof link
// (the /proofs honesty rule: a link exists only for a real signature).
function momentView(m: MomentWithCtx) {
  return {
    id: m.id,
    createdAt: m.createdAt,
    matchId: m.market.matchId,
    home: m.market.match.home, // full name; the frontend derives code + crest from baked wc26 (ADR-051)
    away: m.market.match.away,
    imageUri: m.imageUri,
    swing: m.swing, // |Δ fair| in bps that triggered the moment; null on legacy rows
    mintSig: m.mintSig ?? null, // raw Solana signature; null until minted
    minted: !!m.mintSig,
  };
}

// --- OpenAPI schemas (additive). ---
const momentSchema = {
  type: "object",
  additionalProperties: true,
  properties: {
    id: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    matchId: { type: "string" },
    home: { type: "string" },
    away: { type: "string" },
    imageUri: { type: "string" },
    swing: { type: "number", nullable: true, description: "|Δ fair| in bps that triggered the moment; null on legacy rows" },
    mintSig: { type: "string", nullable: true, description: "raw Solana signature; null until minted (no dead proof link)" },
    minted: { type: "boolean" },
  },
};
const errorSchema = { type: "object", additionalProperties: true, properties: { error: { type: "string" } } };

export function registerMomentRoutes(app: FastifyInstance): void {
  // GET /moments — the moments wall, newest first (createdAt indexed). Optional ?matchId= filter, ?limit= (≤100).
  // Public: moments are a shareable highlight surface, no auth needed to browse.
  app.get("/moments", {
    schema: {
      tags: ["moments"],
      summary: "Moments wall",
      description: "Public. Biggest-swing cards, newest first. Optional matchId filter. mintSig is the raw Solana signature (client builds the Solscan URL), null until minted. Play-money: a moment is a keepsake, not a position.",
      querystring: { type: "object", additionalProperties: true, properties: { matchId: { type: "string" }, limit: { type: "string", description: "max rows (1..100; default 50)" } } },
      response: { 200: { type: "object", additionalProperties: true, properties: { moments: { type: "array", items: momentSchema } } } },
    },
  }, async (req) => {
    const q = req.query as { matchId?: string; limit?: string };
    const limit = Math.min(100, Math.max(1, Number(q.limit) || 50));
    const where = q.matchId ? { market: { matchId: q.matchId } } : {};
    const rows = (await prisma.moment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { market: { include: { match: true } } },
    })) as MomentWithCtx[];
    return { moments: rows.map(momentView) };
  });

  // GET /moments/:id — a single moment (the share/detail target). 404 if it doesn't exist.
  app.get("/moments/:id", {
    schema: {
      tags: ["moments"],
      summary: "Moment detail",
      description: "Public. A single moment (the share/detail target). 404 if it doesn't exist.",
      params: { type: "object", additionalProperties: true, properties: { id: { type: "string" } } },
      response: { 200: { type: "object", additionalProperties: true, properties: { moment: momentSchema } }, 404: errorSchema },
    },
  }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = (await prisma.moment.findUnique({
      where: { id },
      include: { market: { include: { match: true } } },
    })) as MomentWithCtx | null;
    if (!row) return reply.code(404).send({ error: "moment not found" });
    return { moment: momentView(row) };
  });
}
