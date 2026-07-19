// VERIFY (ADR-085 GAP 1): the Redis read-providers parse the REAL read-models and degrade honestly — never a
// fabricated team/price/rank. Fake RedisReader so no live Redis is needed.
import { describe, it, expect } from "vitest";
import { parseFixtureMeta, makeGetFixture, makeGetLeaderboardStat, listFixtures, topTraders, FIXTURES_KEY, LB_KEY, type RedisReader } from "./providers";

const fix = (o: Record<string, unknown>) => JSON.stringify(o);

function fakeRedis(data: { hash?: Record<string, Record<string, string>>; zset?: Array<[string, number]> }): RedisReader {
  return {
    hget: async (k, f) => data.hash?.[k]?.[f] ?? null,
    hgetall: async (k) => data.hash?.[k] ?? {},
    zcard: async () => data.zset?.length ?? 0,
    zrevrange: async (_k, s, e) => {
      const sorted = [...(data.zset ?? [])].sort((a, b) => b[1] - a[1]).slice(s, e + 1);
      return sorted.flatMap(([m, sc]) => [m, String(sc)]);
    },
  };
}

describe("providers — GAP 1 real read-models", () => {
  it("parseFixtureMeta reads teams + competition and respects Participant1IsHome", () => {
    expect(parseFixtureMeta(fix({ Participant1: "Canada", Participant2: "Morocco", Competition: "FIFA World Cup" }))).toEqual({
      home: { name: "Canada" },
      away: { name: "Morocco" },
      stage: "FIFA World Cup",
    });
    // Participant1IsHome:false → the sides swap (no fabricated home/away).
    expect(parseFixtureMeta(fix({ Participant1: "Canada", Participant2: "Morocco", Participant1IsHome: false, Competition: "R16" }))).toEqual({
      home: { name: "Morocco" },
      away: { name: "Canada" },
      stage: "R16",
    });
  });

  it("parseFixtureMeta returns null on unusable input (never a placeholder team)", () => {
    expect(parseFixtureMeta("not json")).toBeNull();
    expect(parseFixtureMeta(fix({ Participant1: "Canada" }))).toBeNull(); // missing away
  });

  it("getFixture reads fixtures:current[matchId], null when absent", async () => {
    const redis = fakeRedis({ hash: { [FIXTURES_KEY]: { "18193785": fix({ Participant1: "Brazil", Participant2: "Japan", Competition: "Group C" }) } } });
    const getFixture = makeGetFixture(redis);
    expect(await getFixture("18193785")).toEqual({ home: { name: "Brazil" }, away: { name: "Japan" }, stage: "Group C" });
    expect(await getFixture("does-not-exist")).toBeNull();
  });

  it("getLeaderboard degrades honestly: platform trader count from ZCARD lb:global, 0 swing", async () => {
    const redis = fakeRedis({ zset: [["hexfan", 2431], ["vd", 1200], ["pitchwizard", -50]] });
    const get = makeGetLeaderboardStat(redis);
    expect(await get("any-match")).toEqual({ traders: 3, topSwing: 0 });
    expect(await makeGetLeaderboardStat(fakeRedis({}))("m")).toEqual({ traders: 0, topSwing: 0 });
  });

  it("listFixtures returns real fixtures, soonest first, with a coarse live flag", async () => {
    const now = 1_000_000;
    const redis = fakeRedis({
      hash: {
        [FIXTURES_KEY]: {
          "2": fix({ Participant1: "Spain", Participant2: "Argentina", Competition: "Final", StartTime: now + 60_000 }),
          "1": fix({ Participant1: "Canada", Participant2: "Morocco", Competition: "R16", StartTime: now - 60_000 }),
        },
      },
    });
    const list = await listFixtures(redis, now);
    expect(list.map((f) => f.matchId)).toEqual(["1", "2"]); // sorted by startTime
    expect(list[0]).toMatchObject({ home: "Canada", away: "Morocco", live: true });
    expect(list[1]).toMatchObject({ home: "Spain", away: "Argentina", live: false });
  });

  it("topTraders reads lb:global as ranked rows", async () => {
    const redis = fakeRedis({ zset: [["hexfan", 2431], ["vd", 1200], ["pitchwizard", -50]] });
    const rows = await topTraders(redis, 5);
    expect(rows).toEqual([
      { rank: 1, userId: "hexfan", pnl: 2431 },
      { rank: 2, userId: "vd", pnl: 1200 },
      { rank: 3, userId: "pitchwizard", pnl: -50 },
    ]);
    expect(LB_KEY).toBe("lb:global");
  });
});
