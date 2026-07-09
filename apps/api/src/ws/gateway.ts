// uWS gateway — the hot path to the frontend. Channels: m:{match}:prices|events|booth, lb:global.
// Bridges bus topics → WS channels. Split into two parts so the mapping is testable independent of the transport:
//   • attachBridge(bus, publish) — the pure-ish bridge: consume topics, build seq'd frames, hand them to `publish`.
//   • startWs(bus)               — the uWebSockets.js transport that fans frames out to subscribers.
// Extraction-ready: imports only schema/bus/channels — never engine/ or http/.
//
// Frame shape (matches web/src/lib/ws.ts): { ch, seq, t, d }. Client subscribes with { op:"sub", ch:[…], since:{ch:seq} }.
// NOTE: `since`-based Redis-stream BACKFILL is a follow-up — this bridge fans out LIVE frames.
import { TOPICS, type Envelope } from "@omnipitch/schema";
import type { Bus } from "@omnipitch/bus";
import { channels } from "./channels";

const WS_PORT = Number(process.env.WS_PORT ?? 4001);

export interface WsHandle {
  stop: () => void;
}
export interface Frame {
  ch: string;
  seq: number;
  t: number;
  d: unknown;
}
export type Publish = (ch: string, frame: Frame) => void;

/** Subscribe the bus topics and emit seq'd frames per channel via `publish`. Transport-agnostic (testable). */
export async function attachBridge(bus: Bus, publish: Publish): Promise<void> {
  const seq: Record<string, number> = {};
  const emit = (ch: string, d: unknown) => publish(ch, { ch, seq: (seq[ch] = (seq[ch] ?? 0) + 1), t: Date.now(), d });

  await bus.consume(TOPICS.pricesMarks, "ws-bridge", async (env: Envelope) => {
    const p = env.payload as { fair?: Record<string, number>; hazard?: number; b_hint?: number };
    if (p.fair) emit(channels.prices(env.match_id), { fair: p.fair, hazard: p.hazard, bHint: p.b_hint });
  });
  await bus.consume(TOPICS.matchEvents, "ws-bridge", async (env: Envelope) => {
    emit(channels.events(env.match_id), { type: env.type, ...(env.payload as object) });
  });
  await bus.consume(TOPICS.commentary, "ws-bridge", async (env: Envelope) => {
    emit(channels.booth(env.match_id), env.payload);
  });
  // Leaderboard reorders whenever credits move P&L; publish the delta so lb:global subscribers re-rank.
  await bus.consume(TOPICS.credits, "ws-bridge", async (env: Envelope) => {
    const p = env.payload as { user_id?: string; kind?: string; amount?: number };
    emit(channels.lb, { userId: p.user_id, kind: p.kind, amount: p.amount });
  });
}

/** Prod transport: uWebSockets.js server fanning the bridge frames out to channel subscribers. */
export async function startWs(bus: Bus): Promise<WsHandle | null> {
  let uws: typeof import("uWebSockets.js");
  try {
    uws = await import("uWebSockets.js");
  } catch (e) {
    // uWS ships prebuilt binaries only for Node LTS 16/18/20 — on other runtimes it can't load. HTTP stays up;
    // run the API on a supported Node for the live WS transport. The bridge mapping is verified independently.
    console.error(JSON.stringify({ evt: "ws.unavailable", msg: String((e as Error)?.message ?? e).split("\n")[0] }));
    return null;
  }
  const app = uws.App().ws("/*", {
    idleTimeout: 60,
    maxBackpressure: 1 << 20,
    message: (ws, message) => {
      try {
        const msg = JSON.parse(Buffer.from(message).toString()) as { op?: string; ch?: unknown };
        if (msg.op === "sub" && Array.isArray(msg.ch)) for (const c of msg.ch) if (typeof c === "string") ws.subscribe(c);
      } catch {
        /* ignore malformed sub */
      }
    },
  });
  await attachBridge(bus, (ch, frame) => app.publish(ch, JSON.stringify(frame)));
  return new Promise<WsHandle | null>((resolve) => {
    app.listen(WS_PORT, (token) => {
      if (!token) return resolve(null);
      console.log(JSON.stringify({ evt: "ws.ready", port: WS_PORT }));
      resolve({ stop: () => uws.us_listen_socket_close(token) });
    });
  });
}
