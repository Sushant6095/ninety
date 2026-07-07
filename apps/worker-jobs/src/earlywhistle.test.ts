// VERIFY (52B): two concurrent matches → two independent pinned cards; goal → instant edit; halt renders;
// settled freezes + posts the Moment photo; /match one-shot; fire-and-forget never throws into the pipeline.
import { describe, it, expect } from "vitest";
import { TOPICS, type Envelope } from "@omnipitch/schema";
import type { Bus } from "@omnipitch/bus";
import type { TelegramClient } from "./tg";
import { Scheduler } from "./scheduler";
import { startEarlyWhistle } from "./earlywhistle";
import type { FixtureMeta } from "./matchcard";

const flush = async () => {
  for (let i = 0; i < 6; i++) await new Promise((r) => setTimeout(r, 0));
};

function mockBus() {
  const handlers = new Map<string, (e: Envelope) => Promise<void>>();
  const bus = {
    publish: async () => {},
    consume: async (t: string, _g: string, h: (e: Envelope) => Promise<void>) => void handlers.set(t, h),
    close: async () => {},
  } as unknown as Bus;
  return { bus, deliver: (t: string, e: Envelope) => handlers.get(t)!(e) };
}

interface Call { m: string; chat: string; id?: number; text?: string; hasPhoto?: boolean; replyTo?: number }
function mockTg() {
  const calls: Call[] = [];
  let id = 100;
  const tg: TelegramClient = {
    sendMessage: async (chat, text) => { calls.push({ m: "send", chat, text }); return { message_id: ++id }; },
    editMessageText: async (chat, mid, text) => void calls.push({ m: "edit", chat, id: mid, text }),
    pinChatMessage: async (chat, mid) => void calls.push({ m: "pin", chat, id: mid }),
    unpinChatMessage: async (chat, mid) => void calls.push({ m: "unpin", chat, id: mid }),
    sendPhoto: async (chat, _photo, opts) => { calls.push({ m: "photo", chat, replyTo: opts?.reply_to_message_id, hasPhoto: true }); return { message_id: ++id }; },
  };
  return { tg, calls };
}

const env = (type: string, match_id: string, payload: Record<string, unknown>): Envelope =>
  ({ event_id: "e", source: "engine", source_seq: 1, match_id, ts_source: "", ts_ingest: "", type, payload }) as unknown as Envelope;
const mark = (m: string, fair: Record<string, number>): Envelope => env("mark", m, { market_id: `${m}:win`, fair });

const FIX: Record<string, FixtureMeta> = {
  A: { home: { name: "Canada", code: "CAN" }, away: { name: "Morocco", code: "MAR" }, stage: "R16" },
  B: { home: { name: "Brazil", code: "BRA" }, away: { name: "Japan", code: "JPN" }, stage: "R16" },
};

describe("EarlyWhistle live cards", () => {
  it("two concurrent matches: independent pinned cards, goal→edit, halt, settled+photo, /match", async () => {
    let T = 0;
    const { bus, deliver } = mockBus();
    const { tg, calls } = mockTg();
    const scheduler = new Scheduler();
    const ew = await startEarlyWhistle({
      bus,
      telegram: tg,
      channelId: "@chan",
      appUrl: "https://o.gg",
      getFixture: async (m) => FIX[m] ?? null,
      getLeaderboard: async () => ({ traders: 1204, topSwing: 842 }),
      getMomentPng: async (m) => (m === "A" ? Buffer.from("png") : null),
      scheduler,
      now: () => T,
    });

    // kickoff both matches → two posts + two pins
    await deliver(TOPICS.matchEvents, env("kickoff", "A", { status: "1H" }));
    await deliver(TOPICS.matchEvents, env("kickoff", "B", { status: "1H" }));
    await flush();
    await scheduler.pump(T);
    expect(calls.filter((c) => c.m === "send").length).toBe(2);
    expect(calls.filter((c) => c.m === "pin").length).toBe(2);
    const idA = ew.cards.get("A")!.messageId!;
    const idB = ew.cards.get("B")!.messageId!;
    expect(idA).not.toBe(idB); // independent cards

    // marks for both + a goal for A only → A edits immediately, B untouched
    T = 1000;
    await deliver(TOPICS.pricesMarks, mark("A", { H: 0.5, D: 0.3, A: 0.2 }));
    await deliver(TOPICS.pricesMarks, mark("B", { H: 0.4, D: 0.3, A: 0.3 }));
    await deliver(TOPICS.matchEvents, env("goal", "A", { team: "home", minute: 38, score: { home: 1, away: 0 } }));
    await flush();
    calls.length = 0;
    await scheduler.pump(T);
    const editA = calls.filter((c) => c.m === "edit" && c.id === idA);
    expect(editA.length).toBeGreaterThanOrEqual(1); // goal → instant edit
    expect(calls.filter((c) => c.m === "edit" && c.id === idB).length).toBe(0); // B independent, no trigger
    expect(editA[0].text).toContain("1 – 0"); // A's own score, not B's

    // halt A → header flips
    T = 2000;
    await deliver(TOPICS.matchEvents, env("halt", "A", { reason: "goal", spread_mult: 2 }));
    await flush();
    calls.length = 0;
    await scheduler.pump(T);
    expect(calls.find((c) => c.m === "edit" && c.id === idA)?.text).toContain("🟠 HALTED — repricing");

    // settled A → final edit + unpin + Moment photo (reply to the card)
    T = 3000;
    await deliver(TOPICS.settlement, env("settled", "A", { result: "H", sig: "5xSig" }));
    await flush();
    calls.length = 0;
    await scheduler.pump(T);
    expect(calls.find((c) => c.m === "edit" && c.id === idA)?.text).toContain("✅ proof verified on Solana");
    expect(calls.find((c) => c.m === "unpin" && c.id === idA)).toBeTruthy();
    expect(calls.find((c) => c.m === "photo" && c.replyTo === idA)?.hasPhoto).toBe(true);

    // /match Brazil (B still live) → one-shot DM card, no pin
    calls.length = 0;
    const render = await ew.handleMatchCommand("Brazil", "dm42");
    expect(render).not.toBeNull();
    expect(render!.text).toContain("BRAZIL");
    expect(calls.find((c) => c.m === "send" && c.chat === "dm42")).toBeTruthy();
    expect(calls.some((c) => c.m === "pin")).toBe(false); // one-shot never pins

    await ew.stop();
  });

  it("is fire-and-forget: a failing fixture lookup still posts a default card and never throws", async () => {
    let T = 0;
    const { bus, deliver } = mockBus();
    const { tg, calls } = mockTg();
    const scheduler = new Scheduler();
    const ew = await startEarlyWhistle({
      bus,
      telegram: tg,
      channelId: "@c",
      appUrl: "x",
      getFixture: async () => {
        throw new Error("db down");
      },
      getLeaderboard: async () => ({ traders: 0, topSwing: 0 }),
      scheduler,
      now: () => T,
    });
    await deliver(TOPICS.matchEvents, env("kickoff", "Z", { status: "1H" }));
    await flush();
    await scheduler.pump(T);
    expect(calls.filter((c) => c.m === "send").length).toBe(1); // posted despite the fixture error
    await ew.stop();
  });
});
