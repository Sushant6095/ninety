// Live-market creation projection (ADR-084 follow-up — closes the CONNECT gap).
//
// GET /markets lists `prisma.market.findMany()` (Postgres) ⨝ the live mark from Redis. But live TxLINE fixtures
// only ever reached Redis (`fixtures:current`) + the bus — they NEVER became PG Market/Match rows (only
// prisma/seed-demo.ts did, for one fixture). So the WC Final could be priced by cortex (`market:{fixtureId}` in
// Redis, keyed by the synth-mark invariant marketId===matchId===fixtureId, synth_marks.py) yet never appear in
// GET /markets. This consumer closes it: on an `open` match-event, it upserts the Match + a 1X2 Market
// (id === matchId === fixtureId) from the fixture snapshot the ingest keeps in Redis `fixtures:current`.
//
// A NEW consumer group is created at "0" (bus law), so it replays the retained match.events backlog — it never
// misses an `open` published during a rolling deploy. Idempotent (upsert); safe to re-run every poll.
import type { Bus } from "@omnipitch/bus";
import type { Redis } from "ioredis";
import { TOPICS, type Envelope } from "@omnipitch/schema";
import { prisma } from "../db";

const FIXTURES_HASH = "fixtures:current"; // ingest's compacted fixture cache: field = fixtureId → fixture JSON
// Known WC26 knockout stages by TxLINE fixtureId (the txline fixtures feed carries no round). Falls back to the
// competition label for anything unmapped — always a real string, never invented.
const STAGE_BY_FIXTURE: Record<string, string> = { "18257739": "Final", "18257865": "Third place" };

interface TxFixture { FixtureId?: number; Participant1?: string; Participant2?: string; StartTime?: number; Competition?: string }

export async function startMarketCreation(bus: Bus, redis: Redis): Promise<void> {
  await bus.consume(TOPICS.matchEvents, "market-creation", async (env: Envelope) => {
    if (env.type !== "open") return;
    const matchId = env.match_id;
    const raw = await redis.hget(FIXTURES_HASH, matchId);
    if (!raw) return; // fixture detail not cached yet — the ingest re-emits `open` on its next poll
    let f: TxFixture;
    try { f = JSON.parse(raw) as TxFixture; } catch { return; }
    if (!f.Participant1 || !f.Participant2) return; // never create a nameless match
    const stage = STAGE_BY_FIXTURE[matchId] ?? f.Competition ?? "World Cup";
    const kickoffAt = f.StartTime ? new Date(f.StartTime) : new Date();
    await prisma.match.upsert({
      where: { id: matchId },
      update: { home: f.Participant1, away: f.Participant2, stage, kickoffAt },
      create: { id: matchId, home: f.Participant1, away: f.Participant2, stage, kickoffAt, status: "SCHEDULED" },
    });
    await prisma.market.upsert({
      where: { id: matchId }, // marketId === matchId === fixtureId — the synth-mark key markets-read writes to
      update: { status: "OPEN" },
      create: { id: matchId, matchId, kind: "1X2", status: "OPEN", bParam: 300 },
    });
    console.log(JSON.stringify({ evt: "market.created", matchId, home: f.Participant1, away: f.Participant2, stage }));
  });
}
