// VERIFY (ADR-085 GAP 2): inbound dispatch — each command routes to the right reply, unknown is friendly, the
// Follow callback is acked, per-chat rate-limit drops the overflow, and a 429 is retried after retryAfter.
import { describe, it, expect } from "vitest";
import { startInbound } from "./inbound";
import { TgApiError, type PollingClient, type TelegramClient, type TgUpdate } from "./tg";
import type { RedisReader } from "./providers";
import type { CardState } from "./card";

const card: CardState = {
  matchId: "18193785", state: "live", minute: 58, stage: "R16",
  home: { name: "Canada" }, away: { name: "Morocco" }, score: { home: 1, away: 2 },
  marketLabel: "WIN MARKET (play credits)",
  rows: [{ label: "CAN", price: 41, delta: 2, spark: "" }, { label: "MAR", price: 39, delta: -2, spark: "" }],
  traders: 0, topSwing: 0, updatedSecondsAgo: 2,
};

const redis: RedisReader = {
  hget: async () => null,
  hgetall: async () => ({ "1": JSON.stringify({ Participant1: "Canada", Participant2: "Morocco", Competition: "R16", StartTime: 0 }) }),
  zcard: async () => 2,
  zrevrange: async () => ["hexfan", "2431", "vd", "1200"],
};

function fakeTg() {
  const sent: Array<{ chat: string; text: string }> = [];
  const answered: string[] = [];
  let failOnce = false;
  const tg: TelegramClient & PollingClient = {
    sendMessage: async (chat, text) => {
      if (failOnce) { failOnce = false; throw new TgApiError(429, "Too Many Requests", 0); }
      sent.push({ chat, text });
      return { message_id: 1 };
    },
    editMessageText: async () => {},
    pinChatMessage: async () => {},
    unpinChatMessage: async () => {},
    sendPhoto: async () => ({ message_id: 1 }),
    getUpdates: () => new Promise<TgUpdate[]>(() => {}), // park the poll loop; we drive handleUpdate directly
    answerCallbackQuery: async (id) => void answered.push(id),
  };
  return { tg, sent, answered, setFailOnce: () => (failOnce = true) };
}

const msg = (text: string, chat = 1): TgUpdate => ({ update_id: 1, message: { message_id: 1, chat: { id: chat, type: "private" }, text } });
const APP = "https://ninety-nu.vercel.app";

function make(over: Partial<Parameters<typeof startInbound>[0]> = {}) {
  const f = fakeTg();
  const ib = startInbound({ telegram: f.tg, appUrl: APP, redis, priceLookup: (q) => (q.toLowerCase().includes("canada") ? card : null), now: () => 1000, ...over });
  return { ...f, ib };
}

describe("inbound dispatch", () => {
  it("routes /start /help /matches /price /leaderboard, unknown → friendly", async () => {
    const { ib, sent } = make();
    await ib.handleUpdate(msg("/start"));
    await ib.handleUpdate(msg("/help"));
    await ib.handleUpdate(msg("/matches"));
    await ib.handleUpdate(msg("/price Canada"));
    await ib.handleUpdate(msg("/leaderboard"));
    await ib.handleUpdate(msg("/bogus"));
    await ib.stop();
    expect(sent.map((s) => s.text)).toEqual([
      expect.stringMatching(/Ninety/),
      expect.stringMatching(/What I can do/),
      expect.stringMatching(/Canada v Morocco/),
      expect.stringMatching(/CAN 41\.0/),
      expect.stringMatching(/hexfan/),
      expect.stringMatching(/didn't catch/),
    ]);
  });

  it("/price with no live match degrades honestly", async () => {
    const { ib, sent } = make();
    await ib.handleUpdate(msg("/price Narnia"));
    await ib.stop();
    expect(sent[0].text).toMatch(/No live market/i);
  });

  it("acks the Follow callback (spinner stops), no message sent", async () => {
    const { ib, sent, answered } = make();
    await ib.handleUpdate({ update_id: 5, callback_query: { id: "cb1", data: "follow:18193785" } });
    await ib.stop();
    expect(answered).toEqual(["cb1"]);
    expect(sent).toHaveLength(0);
  });

  it("rate-limits per chat (drops the overflow)", async () => {
    const { ib, sent } = make({ rateLimit: { max: 2, windowMs: 100_000 } });
    await ib.handleUpdate(msg("/help"));
    await ib.handleUpdate(msg("/help"));
    await ib.handleUpdate(msg("/help")); // 3rd → dropped
    await ib.stop();
    expect(sent).toHaveLength(2);
  });

  it("honours TgApiError.retryAfter on 429 (retries the send)", async () => {
    const { ib, sent, setFailOnce } = make();
    setFailOnce();
    await ib.handleUpdate(msg("/help"));
    await ib.stop();
    expect(sent).toHaveLength(1); // first attempt threw 429(retryAfter:0), retry succeeded
  });
});
