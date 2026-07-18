import { describe, it, expect } from "vitest";
import Fastify from "fastify";
import { registerPlayerRoutes } from "./players";

// Reads the real baked apps/web/src/data/wc26/player-profiles.json (cwd = apps/api → ../web/…). If the bake is
// absent the route degrades to 503 by contract — so we assert that honest shape too rather than hard-failing.
const app = () => {
  const a = Fastify();
  registerPlayerRoutes(a);
  return a;
};

describe("GET /players (read-model)", () => {
  it("returns the top-20 index (or an honest 503 when unbaked)", async () => {
    const res = await app().inject({ method: "GET", url: "/players" });
    if (res.statusCode === 503) {
      expect(res.json().needs).toContain("bake-player-profiles");
      return;
    }
    expect(res.statusCode).toBe(200);
    const body = res.json() as { players: { id: string; rank: number }[] };
    expect(body.players.length).toBe(20);
    expect(body.players[0].rank).toBe(1);
  });

  it("resolves a known id and 404s an unknown one", async () => {
    const a = app();
    const list = await a.inject({ method: "GET", url: "/players" });
    if (list.statusCode === 503) return; // unbaked env — covered above
    const firstId = (list.json() as { players: { id: string }[] }).players[0].id;

    const hit = await a.inject({ method: "GET", url: `/players/${firstId}` });
    expect(hit.statusCode).toBe(200);
    expect((hit.json() as { player: { id: string } }).player.id).toBe(firstId);

    const miss = await a.inject({ method: "GET", url: "/players/__nope__" });
    expect(miss.statusCode).toBe(404);
  });
});
