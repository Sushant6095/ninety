import Fastify from "fastify";
import { createBus, type Bus } from "@omnipitch/bus";
import { registerAdminRoutes } from "./routes/admin";
import { registerAuthRoutes } from "./routes/auth";
import { registerMarketRoutes } from "./routes/markets";
import { registerLeaderboardRoutes } from "./routes/leaderboard";
import { registerPortfolioRoutes } from "./routes/portfolio";
import { registerWebhookRoutes } from "./routes/webhooks";
import { assertSecretsAtBoot } from "../auth/secrets";
import { ConsoleOtpSender, UnconfiguredOtpSender } from "../auth/otp";
import { redis } from "../redis";
import { startMarketsRead } from "../services/markets-read";
import { startWs } from "../ws/gateway";

export async function startHttp(bus?: Bus) {
  assertSecretsAtBoot(); // fail fast if JWT_SECRET / EMBEDDED_WALLET_SECRET are missing in production
  const app = Fastify();
  app.get("/health", async () => ({ ok: true }));
  // routes: ./routes/*.ts — markets, orders, portfolio, leaderboard, moments, auth, admin(replay)
  // prod MUST inject a real email OtpSender; dev logs the code, prod default throws until one is wired.
  const otpSender = process.env.NODE_ENV === "production" ? new UnconfiguredOtpSender() : new ConsoleOtpSender();
  registerAuthRoutes(app, otpSender); // /auth/embedded/start+verify, /export, /challenge, /connect, /me (prompt 25)
  registerMarketRoutes(app); // GET /markets (list) + /markets/:matchId (detail + mark-implied amm) + /quote (ADR-046)
  registerLeaderboardRoutes(app); // GET /leaderboard — reads the lb:global zset (ADR-027)
  registerPortfolioRoutes(app); // GET /portfolio — open positions + equity (read model, ADR-046)
  const b = bus ?? (await createBus());
  registerWebhookRoutes(app, b); // POST /webhooks/helius → chain_events + settled envelope (prompt 23)
  registerAdminRoutes(app, b);
  await startMarketsRead(b, redis); // prices.marks → Redis market:{id} (the live-price read model)
  await app.listen({ port: 4000, host: "0.0.0.0" });
  void startWs(b).catch((e) => console.error(JSON.stringify({ evt: "ws.start.error", msg: String((e as Error)?.message ?? e) }))); // WS bridge (non-fatal)
  return app;
}
