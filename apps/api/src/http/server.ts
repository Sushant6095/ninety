import Fastify from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { createBus, type Bus } from "@omnipitch/bus";
import type { Engine } from "../engine";
import { registerAdminRoutes } from "./routes/admin";
import { registerAuthRoutes } from "./routes/auth";
import { registerMarketRoutes } from "./routes/markets";
import { registerLeaderboardRoutes } from "./routes/leaderboard";
import { registerPortfolioRoutes } from "./routes/portfolio";
import { registerOrderRoutes } from "./routes/orders";
import { registerMomentRoutes } from "./routes/moments";
import { registerGameRoutes } from "./routes/games";
import { registerEventRoutes } from "./routes/events";
import { registerSearchRoutes } from "./routes/search";
import { registerRichDataRoutes } from "./routes/richdata";
import { registerWebhookRoutes } from "./routes/webhooks";
import { assertSecretsAtBoot } from "../auth/secrets";
import { ConsoleOtpSender, UnconfiguredOtpSender } from "../auth/otp";
import { redis } from "../redis";
import { startMarketsRead } from "../services/markets-read";
import { startEventsRead } from "../services/events-read";
import { startWs } from "../ws/gateway";

export async function startHttp(bus?: Bus, engine?: Engine | null) {
  assertSecretsAtBoot(); // fail fast if JWT_SECRET / EMBEDDED_WALLET_SECRET are missing in production
  const app = Fastify();
  // OpenAPI / Swagger UI at GET /docs (registered BEFORE routes so its onRoute hook captures every schema).
  // bearerAuth lets the auth-gated endpoints be tested with the demo JWT via "Authorize" in the UI.
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Ninety API",
        description:
          "Live football exchange for WC26 — play-money (credits only, never bet/stake/odds/wager), priced by TxLINE, settled trustlessly on Solana. Every registered endpoint with its request + response schema. Paste the demo JWT via Authorize to try the auth-gated routes.",
        version: "1.0.0",
      },
      tags: [
        { name: "markets", description: "Discovery, detail (mark-implied AMM), quote" },
        { name: "orders", description: "Place a trade (engine single-writer) + order history" },
        { name: "portfolio", description: "Open positions, live P&L, free credits" },
        { name: "leaderboard", description: "Net play-money P&L ranking" },
        { name: "moments", description: "Biggest-swing cards + Solana proof" },
        { name: "games", description: "Next-Goal play-money picks" },
        { name: "matches", description: "In-play timeline — events + actions (TxLINE)" },
        { name: "search", description: "Teams + matches" },
        { name: "rich", description: "Cached STILL data (Football-Data / API-Football), env-gated" },
        { name: "auth", description: "Embedded + external wallet auth (ADR-006/033)" },
        { name: "system", description: "Health, webhooks, admin" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "Demo JWT for verify-user-1 (NEXT_PUBLIC_DEMO_TOKEN). Auth-gated routes require it.",
          },
        },
      },
    },
  });
  await app.register(fastifySwaggerUi, { routePrefix: "/docs" });
  app.get("/health", { schema: { tags: ["system"], summary: "Liveness probe", response: { 200: { type: "object", properties: { ok: { type: "boolean" } } } } } }, async () => ({ ok: true }));
  // routes: ./routes/*.ts — markets, orders, portfolio, leaderboard, moments, auth, admin(replay)
  // prod MUST inject a real email OtpSender; dev logs the code, prod default throws until one is wired.
  const otpSender = process.env.NODE_ENV === "production" ? new UnconfiguredOtpSender() : new ConsoleOtpSender();
  registerAuthRoutes(app, otpSender); // /auth/embedded/start+verify, /export, /challenge, /connect, /me (prompt 25)
  registerMarketRoutes(app); // GET /markets (list) + /markets/:matchId (detail + mark-implied amm) + /quote (ADR-046)
  registerLeaderboardRoutes(app); // GET /leaderboard — reads the lb:global zset (ADR-027)
  registerPortfolioRoutes(app); // GET /portfolio — open positions + equity (read model, ADR-046)
  registerOrderRoutes(app, engine ?? null); // POST /orders → engine.submit (single writer); GET /orders (ADR-071)
  registerMomentRoutes(app); // GET /moments (wall) + /moments/:id — biggest-swing cards + Solscan proof (ADR-072)
  registerGameRoutes(app); // GET/POST /games/picks — the free Next-Goal prediction (play-money, ADR-072)
  registerEventRoutes(app); // GET /matches/:id/events + /actions — TxLINE-sourced timeline (ADR-072)
  registerSearchRoutes(app); // GET /search?q= — teams + matches from Postgres (ADR-072)
  registerRichDataRoutes(app); // GET /rich/* — cached STILL data (FD.org + API-Football), env-gated (ADR-072)
  const b = bus ?? (await createBus());
  registerWebhookRoutes(app, b); // POST /webhooks/helius → chain_events + settled envelope (prompt 23)
  registerAdminRoutes(app, b);
  await startMarketsRead(b, redis); // prices.marks → Redis market:{id} (the live-price read model)
  await startEventsRead(b, redis); // match.events + match.actions → Redis m:{id}:events|actions:log (timeline snapshot)
  await app.listen({ port: 4000, host: "0.0.0.0" });
  void startWs(b).catch((e) => console.error(JSON.stringify({ evt: "ws.start.error", msg: String((e as Error)?.message ?? e) }))); // WS bridge (non-fatal)
  return app;
}
