import Fastify from "fastify";
import { createBus, type Bus } from "@omnipitch/bus";
import { registerAdminRoutes } from "./routes/admin";

export async function startHttp(bus?: Bus) {
  const app = Fastify();
  app.get("/health", async () => ({ ok: true }));
  // routes: ./routes/*.ts — markets, orders, portfolio, leaderboard, moments, auth, admin(replay)
  registerAdminRoutes(app, bus ?? (await createBus()));
  await app.listen({ port: 4000, host: "0.0.0.0" });
  return app;
}
