import Fastify from "fastify";
export async function startHttp() {
  const app = Fastify();
  app.get("/health", async () => ({ ok: true }));
  // routes: ./routes/*.ts — markets, orders, portfolio, leaderboard, moments, auth, admin(replay)
  await app.listen({ port: 4000, host: "0.0.0.0" });
}
