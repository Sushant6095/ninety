// Inbound receiver (GAP 2, ADR-085). Long-polling getUpdates → command dispatch. Polling (not a webhook) because Fly
// gives no guaranteed public inbound path without extra config, and polling needs no URL/cert. Read-only + play-money:
// no command mutates state. Per-chat rate limit; TgApiError.retryAfter honoured on 429.
import { TgApiError, type PollingClient, type TelegramClient, type TgUpdate } from "./tg";
import { cmdHelp, cmdLeaderboard, cmdMatches, cmdPrice, cmdStart, cmdUnknown, parseCommand, type Reply } from "./commands";
import { listFixtures, topTraders, type RedisReader } from "./providers";
import type { CardState } from "./card";

export interface InboundDeps {
  telegram: TelegramClient & PollingClient;
  appUrl: string;
  redis: RedisReader;
  /** Current price of a live match by team/name query — from EarlyWhistle's in-memory cards (main.ts closure). */
  priceLookup: (query: string) => CardState | null;
  now?: () => number;
  pollTimeoutSec?: number; // long-poll hold, default 30
  rateLimit?: { max: number; windowMs: number }; // default 6 msgs / 10s per chat
  backoffMs?: number; // network-error backoff, default 3000
}

export interface Inbound {
  stop: () => Promise<void>;
  /** Handle one update (exposed for tests — the loop just feeds this). */
  handleUpdate: (u: TgUpdate) => Promise<void>;
}

const logJson = (o: Record<string, unknown>) => console.log(JSON.stringify(o));
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function startInbound(deps: InboundDeps): Inbound {
  const now = deps.now ?? (() => Date.now());
  const pollTimeout = deps.pollTimeoutSec ?? 30;
  const rl = deps.rateLimit ?? { max: 6, windowMs: 10_000 };
  const backoffMs = deps.backoffMs ?? 3000;
  const opts = { disable_web_page_preview: true } as const;

  const hits = new Map<string, number[]>();
  function limited(chatId: string): boolean {
    const t = now();
    const arr = (hits.get(chatId) ?? []).filter((ts) => t - ts < rl.windowMs);
    if (arr.length >= rl.max) {
      hits.set(chatId, arr);
      return true;
    }
    arr.push(t);
    hits.set(chatId, arr);
    return false;
  }

  async function send(chatId: string, reply: Reply): Promise<void> {
    try {
      await deps.telegram.sendMessage(chatId, reply.text, { ...opts, reply_markup: reply.reply_markup });
    } catch (e) {
      // 429 → wait out Telegram's retry_after, then one retry. Other errors: log and drop (never crash the loop).
      if (e instanceof TgApiError && e.retryAfter != null) {
        await sleep(e.retryAfter * 1000);
        await deps.telegram.sendMessage(chatId, reply.text, { ...opts, reply_markup: reply.reply_markup }).catch((e2) => logJson({ evt: "inbound.send.error", msg: String((e2 as Error)?.message ?? e2) }));
      } else {
        logJson({ evt: "inbound.send.error", msg: String((e as Error)?.message ?? e) });
      }
    }
  }

  async function replyFor(cmd: string, arg: string): Promise<Reply> {
    switch (cmd) {
      case "start":
        return cmdStart(deps.appUrl);
      case "help":
        return cmdHelp();
      case "matches":
        return cmdMatches(await listFixtures(deps.redis, now()));
      case "price":
        return cmdPrice(arg, deps.priceLookup(arg), deps.appUrl);
      case "leaderboard":
        return cmdLeaderboard(await topTraders(deps.redis, 5));
      default:
        return cmdUnknown();
    }
  }

  async function handleUpdate(u: TgUpdate): Promise<void> {
    // Callback (the card's 🔔 Follow button): ack so the client spinner stops. Following isn't a backend feature yet,
    // so the toast is honest and points at the live channel — never a promise we don't keep.
    if (u.callback_query) {
      await deps.telegram.answerCallbackQuery(u.callback_query.id, "Live prices update right here in the channel.").catch(() => {});
      return;
    }
    const msg = u.message;
    if (!msg?.text) return;
    const parsed = parseCommand(msg.text);
    if (!parsed) return; // plain chatter in a group — ignore
    const chatId = String(msg.chat.id);
    if (limited(chatId)) {
      logJson({ evt: "inbound.ratelimited", chat: chatId, cmd: parsed.cmd });
      return; // drop over-limit rather than spam back
    }
    const reply = await replyFor(parsed.cmd, parsed.arg).catch((e) => {
      logJson({ evt: "inbound.cmd.error", cmd: parsed.cmd, msg: String((e as Error)?.message ?? e) });
      return cmdUnknown();
    });
    await send(chatId, reply);
    logJson({ evt: "inbound.cmd", chat: chatId, cmd: parsed.cmd });
  }

  let running = true;
  let offset = 0;
  const loop = async () => {
    logJson({ evt: "inbound.ready", poll: pollTimeout });
    while (running) {
      try {
        const updates = await deps.telegram.getUpdates(offset, pollTimeout);
        for (const u of updates) {
          offset = Math.max(offset, u.update_id + 1);
          if (!running) break;
          await handleUpdate(u).catch((e) => logJson({ evt: "inbound.update.error", msg: String((e as Error)?.message ?? e) }));
        }
      } catch (e) {
        if (e instanceof TgApiError && e.retryAfter != null) await sleep(e.retryAfter * 1000);
        else await sleep(backoffMs); // network blip / conflict → back off, keep polling
      }
    }
  };
  void loop();

  return {
    handleUpdate,
    stop: async () => {
      running = false;
    },
  };
}
