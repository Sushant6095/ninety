// Deterministic in-process TxLINE double for CI + local dev (no network, no creds). It serves the REAL
// payloads captured live into docs/txline-samples/ (ADR-015), so the CI test validates the wrappers'
// zod schemas against real shapes. For a live manual run see packages/chain/scripts/txline-live.mjs.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { FetchLike, MessageSigner, Subscriber } from "./client";

const SAMPLES = fileURLToPath(new URL("../../../docs/txline-samples/", import.meta.url));
const sample = (name: string): unknown => JSON.parse(readFileSync(`${SAMPLES}${name}.json`, "utf8"));

const FIXTURES = sample("fixtures-snapshot") as Array<{ FixtureId: number; CompetitionId: number }>;
// a real World Cup fixtureId from the captured sample
export const WC26_FIXTURE_ID = String((FIXTURES.find((f) => f.CompetitionId === 72) ?? FIXTURES[0]).FixtureId);

export interface MockCalls {
  guestStart: number;
  activate: number;
  data: Array<{ path: string; bearer: string | null; apiToken: string | null }>;
  expireNextToken: boolean;
}

export interface MockTxLine {
  fetch: FetchLike;
  subscriber: Subscriber;
  signer: MessageSigner;
  calls: MockCalls;
}

const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const text = (body: string, status = 200): Response => new Response(body, { status, headers: { "content-type": "text/plain" } });
const sse = (events: unknown[]): Response =>
  new Response(events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("") + ": keep-alive\n\n", { status: 200, headers: { "content-type": "text/event-stream" } });

export function mockTxLine(): MockTxLine {
  const JWT = "jwt.guest.demo.eyJ";
  const API_TOKEN = "txoracle_api_mockdemo"; // activate returns this as a BARE STRING (matches reality)
  const calls: MockCalls = { guestStart: 0, activate: 0, data: [], expireNextToken: false };
  const scores = sample("scores-snapshot") as unknown[];
  const oddsTicks = sample("odds-updates") as unknown[];

  const fetch: FetchLike = async (url, init) => {
    const path = new URL(url).pathname;
    const headers = new Headers(init?.headers);

    if (path === "/auth/guest/start") {
      calls.guestStart++;
      return json({ token: JWT });
    }
    if (path === "/api/token/activate") {
      calls.activate++;
      if (headers.get("authorization") !== `Bearer ${JWT}`) return json({ error: "activate needs guest bearer" }, 401);
      return text(API_TOKEN); // bare-string token, like the live API
    }

    // data endpoints — must carry BOTH headers
    const bearer = headers.get("authorization");
    const apiToken = headers.get("x-api-token");
    calls.data.push({ path, bearer, apiToken });
    if (bearer !== `Bearer ${JWT}` || apiToken !== API_TOKEN) return json({ error: "unauthorized" }, 401);
    if (calls.expireNextToken) {
      calls.expireNextToken = false;
      return json({ error: "token expired" }, 401);
    }
    if (path === "/api/fixtures/snapshot") return json(sample("fixtures-snapshot"));
    if (path.startsWith("/api/scores/snapshot/")) return json(scores);
    if (path.startsWith("/api/scores/updates/")) return json(sample("scores-updates"));
    if (path === "/api/scores/stat-validation") return json(sample("scores-stat-validation"));
    if (path === "/api/scores/stream") return sse([{ Ts: 1 }, ...scores.slice(0, 1)]); // {Ts} keepalive then a real ScoreState — client must skip the keepalive
    if (path.startsWith("/api/odds/snapshot/")) return json(sample("odds-snapshot"));
    if (path.startsWith("/api/odds/updates/")) return json(sample("odds-updates"));
    if (path === "/api/odds/stream") return sse(oddsTicks.slice(0, 2));
    return json({ error: `no mock for ${path}` }, 404);
  };

  const subscriber: Subscriber = { subscribe: async () => "5devnetSubscribeTxSig111111111111111111111111111111111111111111111" };
  const signer: MessageSigner = { publicKey: "Wa11etDemo1111111111111111111111111111111111", sign: async (m) => `ed25519:${m.length}` };
  return { fetch, subscriber, signer, calls };
}
