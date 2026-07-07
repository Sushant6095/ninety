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
    if (path === "/api/scores/schedule") return jsonResponse(WC26_SCHEDULE);
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
