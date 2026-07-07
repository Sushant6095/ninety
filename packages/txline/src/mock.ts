// Deterministic in-process TxLINE double for the verify script + local dev (no network, no creds).
// Design law: real WC26 data in every mock. The client's real transport is global fetch against the
// live API when credentials exist; here we inject this fetch instead.
import type { FetchLike, MessageSigner, Subscriber } from "./client";

export const WC26_FIXTURE_ID = "wc26-1041";

// Sample scores snapshot (S1) — a real WC26 group fixture, point-in-time.
export const WC26_SCORES_SNAPSHOT = {
  fixtureId: WC26_FIXTURE_ID,
  competition: "FIFA World Cup 2026",
  stage: "group",
  group: "G",
  status: "in_play",
  minute: 63,
  home: { team: "Brazil", code: "BRA", goals: 2 },
  away: { team: "Serbia", code: "SRB", goals: 1 },
  asOf: "2026-06-20T19:03:00Z",
  seq: 8814,
  stats: { "1002": 2, "1003": 1 }, // K1 statKeys: home goals / away goals
};

// Sample fixtures schedule (F1).
export const WC26_SCHEDULE = {
  competition: "FIFA World Cup 2026",
  updated: "2026-06-20T18:00:00Z",
  fixtures: [
    { fixtureId: WC26_FIXTURE_ID, kickoff: "2026-06-20T18:00:00Z", stage: "group", group: "G", home: "Brazil", away: "Serbia", status: "in_play" },
    { fixtureId: "wc26-1042", kickoff: "2026-06-20T21:00:00Z", stage: "group", group: "G", home: "Switzerland", away: "Cameroon", status: "scheduled" },
    { fixtureId: "wc26-2003", kickoff: "2026-07-11T19:00:00Z", stage: "quarterfinal", home: "TBD", away: "TBD", status: "scheduled" },
  ],
};

// Sample scores updates bucket (S2).
export const WC26_SCORES_UPDATES = {
  epochDay: 20624,
  hourOfDay: 19,
  interval: 3,
  events: [
    { fixtureId: WC26_FIXTURE_ID, seq: 8801, ts: "2026-06-20T19:00:12Z", type: "goal", team: "away", minute: 55, score: { home: 1, away: 1 } },
    { fixtureId: WC26_FIXTURE_ID, seq: 8814, ts: "2026-06-20T19:03:00Z", type: "goal", team: "home", minute: 62, score: { home: 2, away: 1 } },
  ],
};

// Sample live score events (S3, SSE).
export const WC26_SCORE_EVENTS = [
  { fixtureId: WC26_FIXTURE_ID, seq: 8814, ts: "2026-06-20T19:03:00Z", type: "goal", team: "home", minute: 62, score: { home: 2, away: 1 } },
  { fixtureId: WC26_FIXTURE_ID, seq: 8815, ts: "2026-06-20T19:05:30Z", type: "card", team: "away", minute: 64 },
];

// Sample stat-validation proof bundle (S4) — feeds on-chain validateStat.
export const WC26_STAT_VALIDATION = {
  fixtureId: WC26_FIXTURE_ID,
  seq: 9001,
  epochDay: 20624,
  stats: [
    { statKey: 1002, value: 2 },
    { statKey: 1003, value: 1 },
  ],
  fixtureSummary: "0x" + "ab".repeat(20),
  subTreeProof: ["0x" + "11".repeat(32), "0x" + "22".repeat(32)],
  mainTreeProof: ["0x" + "33".repeat(32)],
  statProof: ["0x" + "44".repeat(32)],
  rootPda: "Da11yScoresRoots111111111111111111111111111",
};

// Sample odds snapshot (O1).
export const WC26_ODDS_SNAPSHOT = {
  fixtureId: WC26_FIXTURE_ID,
  market: "1X2",
  asOf: "2026-06-20T19:03:00Z",
  seq: 4410,
  odds: { H: 1.72, D: 3.6, A: 5.2 },
  overround: 1.06,
};

// Sample odds updates bucket (O2).
export const WC26_ODDS_UPDATES = {
  epochDay: 20624,
  hourOfDay: 19,
  interval: 3,
  ticks: [
    { fixtureId: WC26_FIXTURE_ID, seq: 4408, ts: "2026-06-20T19:02:00Z", market: "1X2", odds: { H: 1.8, D: 3.5, A: 4.9 }, stable: true },
    { fixtureId: WC26_FIXTURE_ID, seq: 4410, ts: "2026-06-20T19:03:00Z", market: "1X2", odds: { H: 1.72, D: 3.6, A: 5.2 }, stable: true },
  ],
};

// Sample live StablePrice ticks (O3, SSE).
export const WC26_ODDS_TICKS = [
  { fixtureId: WC26_FIXTURE_ID, seq: 4410, ts: "2026-06-20T19:03:00Z", market: "1X2", odds: { H: 1.72, D: 3.6, A: 5.2 }, stable: true },
  { fixtureId: WC26_FIXTURE_ID, seq: 4411, ts: "2026-06-20T19:03:05Z", market: "1X2", odds: { H: 1.7, D: 3.62, A: 5.3 }, stable: true },
];

export interface MockCalls {
  guestStart: number;
  activate: number;
  data: Array<{ path: string; bearer: string | null; apiToken: string | null }>;
  /** flip to make the next data request 401 once, to exercise refresh-and-retry */
  expireNextToken: boolean;
}

export interface MockTxLine {
  fetch: FetchLike;
  subscriber: Subscriber;
  signer: MessageSigner;
  calls: MockCalls;
}

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const sseResponse = (events: unknown[]): Response =>
  new Response(events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("") + ": keep-alive\n\n", {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });

export function mockTxLine(): MockTxLine {
  const JWT = "jwt.guest.demo.eyJ";
  const API_TOKEN = "apitok.activated.demo";
  const calls: MockCalls = { guestStart: 0, activate: 0, data: [], expireNextToken: false };

  const fetch: FetchLike = async (url, init) => {
    const path = new URL(url).pathname;
    const headers = new Headers(init?.headers);

    if (path === "/auth/guest/start") {
      calls.guestStart++;
      return jsonResponse({ jwt: JWT });
    }
    if (path === "/api/token/activate") {
      calls.activate++;
      if (headers.get("authorization") !== `Bearer ${JWT}`) return jsonResponse({ error: "activate needs guest bearer" }, 401);
      return jsonResponse({ apiToken: API_TOKEN });
    }

    // data endpoints — must carry BOTH headers
    const bearer = headers.get("authorization");
    const apiToken = headers.get("x-api-token");
    calls.data.push({ path, bearer, apiToken });
    if (bearer !== `Bearer ${JWT}` || apiToken !== API_TOKEN) return jsonResponse({ error: "unauthorized" }, 401);
    if (calls.expireNextToken) {
      calls.expireNextToken = false;
      return jsonResponse({ error: "token expired" }, 401); // triggers client refresh-and-retry
    }
    if (path.startsWith("/api/scores/snapshot/")) return jsonResponse(WC26_SCORES_SNAPSHOT);
    if (path.startsWith("/api/scores/updates/")) return jsonResponse(WC26_SCORES_UPDATES);
    if (path === "/api/scores/stat-validation") return jsonResponse(WC26_STAT_VALIDATION);
    if (path === "/api/scores/stream") return sseResponse(WC26_SCORE_EVENTS);
    if (path === "/api/scores/schedule") return jsonResponse(WC26_SCHEDULE);
    if (path.startsWith("/api/odds/snapshot/")) return jsonResponse(WC26_ODDS_SNAPSHOT);
    if (path.startsWith("/api/odds/updates/")) return jsonResponse(WC26_ODDS_UPDATES);
    if (path === "/api/odds/stream") return sseResponse(WC26_ODDS_TICKS);
    return jsonResponse({ error: `no mock for ${path}` }, 404);
  };

  const subscriber: Subscriber = {
    subscribe: async () => "5devnetSubscribeTxSig111111111111111111111111111111111111111111111",
  };
  const signer: MessageSigner = {
    publicKey: "Wa11etDemo1111111111111111111111111111111111",
    sign: async (message) => `ed25519:${message.length}`,
  };

  return { fetch, subscriber, signer, calls };
}
