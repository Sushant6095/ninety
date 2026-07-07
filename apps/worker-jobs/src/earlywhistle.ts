// EarlyWhistle (52 + 52B): Telegram live match cards. Consumes match.events / prices.marks / commentary /
// settlement off the bus; posts+pins one card per match on kickoff, edits it on an 8s cadence (immediately on
// goal/red/halt/settled), and on settle does a final edit → unpin → Moment photo. /match renders a one-shot.
// LAWS: fire-and-forget (never block the pipeline), booth-voice on every outbound string (in the renderer),
// one global 25/s budget (the Scheduler), cards independent per match_id.
import { TOPICS, type Envelope } from "@omnipitch/schema";
import type { Bus } from "@omnipitch/bus";
import { renderCard, type CardRender } from "./card";
import { MatchCard, type FixtureMeta } from "./matchcard";
import { Scheduler } from "./scheduler";
import type { TelegramClient } from "./tg";

export interface EarlyWhistleDeps {
  bus: Bus;
  telegram: TelegramClient;
  channelId: string;
  appUrl: string;
  getFixture: (matchId: string) => Promise<FixtureMeta | null>;
  getLeaderboard: (matchId: string) => Promise<{ traders: number; topSwing: number }>;
  getMomentPng?: (matchId: string) => Promise<Buffer | null>;
  scheduler?: Scheduler; // inject to drive pump() yourself (tests); omit → self-managed 25/s loop
  now?: () => number;
  cadenceMs?: number; // default 8000
}

export interface EarlyWhistle {
  stop: () => Promise<void>;
  handleMatchCommand: (team: string, chatId: string) => Promise<CardRender | null>;
  cards: Map<string, MatchCard>;
  scheduler: Scheduler;
}

const DEFAULT_META = (): FixtureMeta => ({ home: { name: "Home" }, away: { name: "Away" }, stage: "" });
const logJson = (o: Record<string, unknown>) => console.log(JSON.stringify(o));

export async function startEarlyWhistle(deps: EarlyWhistleDeps): Promise<EarlyWhistle> {
  const now = deps.now ?? (() => Date.now());
  const ownScheduler = !deps.scheduler;
  const scheduler = deps.scheduler ?? new Scheduler({ onError: (label, err) => console.error(JSON.stringify({ evt: "ew.send.error", label, msg: String((err as Error)?.message ?? err) })) });
  const cards = new Map<string, MatchCard>();
  const lbCache = new Map<string, { traders: number; topSwing: number }>();
  const opts = { parse_mode: "MarkdownV2" as const, disable_web_page_preview: true };

  const fireAndForget = (fn: () => void | Promise<void>): void => {
    void Promise.resolve()
      .then(fn)
      .catch((e) => console.error(JSON.stringify({ evt: "ew.error", msg: String((e as Error)?.message ?? e) })));
  };
  const lb = (matchId: string) => lbCache.get(matchId) ?? { traders: 0, topSwing: 0 };
  const refreshLb = (matchId: string) =>
    fireAndForget(async () => {
      lbCache.set(matchId, await deps.getLeaderboard(matchId));
      const card = cards.get(matchId);
      if (card && card.messageId != null && card.state !== "settled") card.dirty = true; // repaint a stale 0/0 first render
    });

  const renderFor = (card: MatchCard): CardRender => renderCard(card.toCardState(now(), lb(card.matchId)), deps.appUrl);

  function scheduleEdit(card: MatchCard, immediate: boolean): void {
    if (card.messageId == null) return;
    const messageId = card.messageId;
    const run = async () => {
      const { text, reply_markup } = renderFor(card);
      await deps.telegram.editMessageText(deps.channelId, messageId, text, { ...opts, reply_markup });
    };
    if (immediate) scheduler.enqueueEvent(`edit:${card.matchId}`, run);
    else scheduler.enqueueEdit(card.matchId, run);
    card.markClean();
  }

  async function ensureCard(env: Envelope): Promise<MatchCard> {
    const existing = cards.get(env.match_id);
    if (existing) return existing;
    // Reserve the slot SYNCHRONOUSLY (before any await) so a concurrent event for the same not-yet-carded
    // match cannot create a second card → no double post/pin. Refine the placeholder meta after the lookup.
    const card = new MatchCard(env.match_id, DEFAULT_META(), now());
    cards.set(env.match_id, card);
    const meta = await deps.getFixture(env.match_id).catch(() => null);
    if (meta) card.setMeta(meta);
    return card;
  }

  async function postAndPin(card: MatchCard): Promise<void> {
    scheduler.enqueueEvent(`post:${card.matchId}`, async () => {
      const { text, reply_markup } = renderFor(card);
      const msg = await deps.telegram.sendMessage(deps.channelId, text, { ...opts, reply_markup });
      card.messageId = msg.message_id;
      await deps.telegram.pinChatMessage(deps.channelId, msg.message_id).catch(() => {});
      card.markClean();
    });
  }

  async function onSettled(card: MatchCard): Promise<void> {
    scheduler.enqueueEvent(`settle:${card.matchId}`, async () => {
      const { text, reply_markup } = renderFor(card);
      if (card.messageId != null) {
        await deps.telegram.editMessageText(deps.channelId, card.messageId, text, { ...opts, reply_markup });
        await deps.telegram.unpinChatMessage(deps.channelId, card.messageId).catch(() => {});
        const png = await deps.getMomentPng?.(card.matchId).catch(() => null);
        if (png) await deps.telegram.sendPhoto(deps.channelId, png, { reply_to_message_id: card.messageId, caption: "Moment of the match" }).catch(() => {});
      }
    });
  }

  async function routeEvent(env: Envelope): Promise<void> {
    const t0 = now();
    refreshLb(env.match_id);
    const card = await ensureCard(env);
    const { immediate } = card.applyEvent(env, now());
    // Post exactly once per match — idempotent on messageId, so a redelivered kickoff never re-posts, and a
    // pre-kickoff first event (goal/settled) still gets a card rendering the current state.
    if (card.messageId == null) await postAndPin(card);
    if (env.type === "settled")
      await onSettled(card); // run the settle sequence (edit→unpin→photo) even when settled arrived first
    else if (card.messageId != null) scheduleEdit(card, immediate);
    logJson({ evt: "ew.delta", stage: env.type, match: env.match_id, dms: now() - t0 });
  }

  function onMark(env: Envelope): void {
    const card = cards.get(env.match_id);
    if (card) card.applyMark(env, now()); // cadence timer flushes the edit
  }
  function onCommentary(env: Envelope): void {
    const card = cards.get(env.match_id);
    const text = (env.payload as { text?: string }).text;
    if (card && text) card.applyBooth(text, now());
  }

  // 8s cadence: edit dirty live/halted cards at low priority (coalesced, never faster than 4s/msg in the scheduler);
  // also evict settled cards a grace period after settle so `cards`/`lbCache` don't grow without bound.
  const EVICT_GRACE_MS = 2 * 60 * 1000;
  const cadence = setInterval(() => {
    const t = now();
    for (const [id, card] of cards) {
      if (card.state === "settled") {
        if (card.settledAt != null && t - card.settledAt > EVICT_GRACE_MS) {
          cards.delete(id);
          lbCache.delete(id);
        }
      } else if (card.dirty && card.messageId != null) {
        scheduleEdit(card, false);
      }
    }
  }, deps.cadenceMs ?? 8000);

  await deps.bus.consume(TOPICS.matchEvents, "earlywhistle", async (env) => fireAndForget(() => routeEvent(env)));
  await deps.bus.consume(TOPICS.settlement, "earlywhistle", async (env) => fireAndForget(() => routeEvent(env)));
  await deps.bus.consume(TOPICS.pricesMarks, "earlywhistle", async (env) => fireAndForget(() => onMark(env)));
  await deps.bus.consume(TOPICS.commentary, "earlywhistle", async (env) => fireAndForget(() => onCommentary(env)));

  const stopScheduler = ownScheduler ? scheduler.start(40) : () => {};

  async function handleMatchCommand(team: string, chatId: string): Promise<CardRender | null> {
    const q = team.trim().toLowerCase();
    const card = [...cards.values()].find((c) => c.toCardState(now(), lb(c.matchId)).home.name.toLowerCase().includes(q) || c.toCardState(now(), lb(c.matchId)).away.name.toLowerCase().includes(q));
    if (!card) {
      await deps.telegram.sendMessage(chatId, `No live match for ${team}\\.`, { parse_mode: "MarkdownV2" }).catch(() => {});
      return null;
    }
    const render = renderFor(card); // same pure renderer, no pin, no auto-edit
    await deps.telegram.sendMessage(chatId, render.text, { ...opts, reply_markup: render.reply_markup }).catch(() => {});
    return render;
  }

  return {
    cards,
    scheduler,
    handleMatchCommand,
    stop: async () => {
      clearInterval(cadence);
      stopScheduler();
    },
  };
}
