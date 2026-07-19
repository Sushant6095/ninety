# Prompt — Session E: full Telegram (EarlyWhistle) integration

Runs in PARALLEL with the TxLINE go-live and Sessions A–D.
You are **Session E**. Your ADR is **ADR-084**. You own `apps/worker-jobs/src/*` and nothing else.

---

```
Complete the EarlyWhistle Telegram integration. It is ~80% built — do NOT rebuild it. Close the two real
gaps, add inbound commands, and prove a card lands in a real Telegram channel.

═══════════════════════════════════════════════════════════
STEP 0 — WHAT ALREADY EXISTS (read it before writing anything)
═══════════════════════════════════════════════════════════
apps/worker-jobs/src/: earlywhistle.ts · tg.ts · card.ts · matchcard.ts · swing-card.ts · scheduler.ts ·
booth.ts · booth-llm.ts · booth-filter.ts — all with tests. ADR-023 documents the design.
tg.ts is a COMPLETE Telegram client: sendMessage, editMessageText, pinChatMessage, unpinChatMessage,
sendPhoto (multipart), and TgApiError carrying retryAfter on 429. It needs no work.
main.ts already gates correctly: `if (token && channelId) startEarlyWhistle(...)` — silent no-op otherwise.

═══════════════════════════════════════════════════════════
STEP 1 — GAP 1: THE DATA PROVIDERS ARE STUBBED (this is the integration)
═══════════════════════════════════════════════════════════
main.ts passes `getFixture: async () => null` with a TODO to back these with Redis. So EarlyWhistle starts
but is blind — cards render empty or degrade. Wire the real providers:
  - getFixture  → the Redis `fixtures:current` hash (live match state: teams, score, minute, status).
  - leaderboard → the `lb:global` zset.
  - moments     → the moments renderer output (swing-card.ts already renders; connect its source).
Read the actual key names/shapes from the code that WRITES them (engine/ingest/api) — do not invent key
names. If a provider genuinely has no source yet, return null and let the card degrade honestly; never
fabricate a score, price or rank.

═══════════════════════════════════════════════════════════
STEP 2 — GAP 2: NO INBOUND. IT IS BROADCAST-ONLY TODAY.
═══════════════════════════════════════════════════════════
There is zero getUpdates/webhook/command handling anywhere. The deck calls this an "AI Pundit Bot", so a
judge WILL open Telegram and type something. Add inbound handling:
  - Transport: long-polling `getUpdates` is simplest and needs no public URL (Fly gives us no guaranteed
    inbound path for a webhook without extra config). Use polling unless a webhook is trivial.
  - Commands, all read-only and play-money safe:
      /start   → what Ninety is, one line, + link to the app
      /matches → today's real fixtures with status (from the same source as the board)
      /price <team|match> → the current market price for that match
      /leaderboard → top 5 from lb:global
      /help    → the command list
  - Unknown command → a friendly one-liner, never silence.
  - Rate-limit per chat; respect TgApiError.retryAfter on 429 (tg.ts already surfaces it).
COPY LAW — this is legal armor and it applies to every bot message, button and command description:
say price · trade · credits · play-money. NEVER bet / stake / odds / wager / gamble. A judge reading the bot
transcript must find zero gambling vocabulary.

═══════════════════════════════════════════════════════════
STEP 3 — BUG: THE CARD LINKS POINT AT A DEAD DOMAIN
═══════════════════════════════════════════════════════════
main.ts: `appUrl: process.env.APP_URL ?? "https://omnipitch.gg"` — that is the retired codename and is not
our site. Every card CTA would 404. Change the fallback to https://ninety-nu.vercel.app and set APP_URL as
a Fly secret in Step 5. Grep for other "omnipitch.gg" / "omnipitch" codename leaks in bot copy.

═══════════════════════════════════════════════════════════
STEP 4 — OWNER BLOCKER (append to docs/BLOCKERS.md, then keep working)
═══════════════════════════════════════════════════════════
B5 — Telegram credentials. Needed from the owner (~2 minutes):
  1. Message @BotFather → /newbot → name it → receive the BOT TOKEN.
  2. Create a public channel or group, add the bot as an ADMIN (it must post + pin).
  3. Get the channel id (e.g. @ninetylive, or the numeric -100… id).
Until these exist, develop against a FAKE TelegramClient (the interface is already injectable — that is what
the existing tests use) and prove every card renders correctly in test output.

═══════════════════════════════════════════════════════════
STEP 5 — DEPLOY (COORDINATE — do not run fly commands alone)
═══════════════════════════════════════════════════════════
The TxLINE go-live session ALSO sets Fly secrets and redeploys. Two simultaneous `fly secrets set` +
deploy will race and one will clobber the other's rollout. Therefore:
  → Batch BOTH sessions' secrets into ONE command and do ONE redeploy:
    fly secrets set TELEGRAM_BOT_TOKEN=<t> EARLYWHISTLE_CHANNEL=<id> APP_URL=https://ninety-nu.vercel.app \
      TXLINE_NETWORK=devnet TXLINE_DEVNET_JWT=<jwt> TXLINE_DEVNET_API_TOKEN=<tok> -a omnipitch
  → Announce "SECRETS SET" and let the redeploy finish before either session verifies.
  → NEVER commit the bot token. Secret-scan before any commit.

═══════════════════════════════════════════════════════════
STEP 6 — VERIFY (a passing test is NOT proof for this one)
═══════════════════════════════════════════════════════════
  - pnpm test for worker-jobs — all existing suites still green.
  - Then the real proof: a card must actually LAND in the Telegram channel. Screenshot it.
    Verify: correct teams, correct score/minute, correct price, working CTA link (click it — it must open
    the real match page, not a 404), and pin/unpin behaves.
  - Send each command from a real Telegram client and screenshot the replies.
  - READ-OUT-LOUD every bot message: the score, minute and price must agree with the terminal at that moment.
    A card that says 74' while the terminal says 58' is a ship-blocker.
  - Zero gambling vocabulary anywhere in the transcript.
  - fly logs — no unhandled TgApiError, no crash loop.
  - Write ADR-084: what was stubbed, what you wired, the command surface, and the polling-vs-webhook call.
```

---

## Notes for Sushant

**This is an activation, not a build.** Like TxLINE, the hard part is done — a real Telegram client with
429 handling, card renderers, a scheduler, the Booth LLM, and tests. Two things are genuinely missing: the
data providers are stubbed to `null` with a TODO, and there is **no inbound command handling at all** — it
can broadcast but cannot answer. Your deck calls it an "AI Pundit Bot", and a judge will type `/start`.

**One bug worth catching now:** the card link fallback is `https://omnipitch.gg`, the retired codename. If
`APP_URL` isn't set, every card CTA in your demo 404s.

**The one thing only you can do** is BotFather — a bot token and a channel where the bot is an admin. About
two minutes, and the demo can't show Telegram without it.

**Coordination note:** Session E and the TxLINE session both want `fly secrets set` and a redeploy. Batch
them into a single command and one rollout, or they'll clobber each other.
