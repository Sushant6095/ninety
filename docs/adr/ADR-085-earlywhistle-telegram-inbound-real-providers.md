# ADR-085 — EarlyWhistle: real data providers + inbound command bot, honest to the read-models

**Status:** Accepted · **Date:** 2026-07-19 · **Follows:** ADR-023 (EarlyWhistle design), ADR-018 (fixtures hash),
ADR-027 (projection / lb:global), ADR-022 (prices.marks), ADR-040 (swing card), ADR-055 (no runtime CDN — n/a here).
· **Owns:** `apps/worker-jobs/src/{providers,commands,inbound}.ts` (+ tests), additive edits to `tg.ts` and `main.ts`,
`docs/BLOCKERS.md` B6.

## Context
EarlyWhistle was ~80% built (ADR-023): a complete Telegram client (`tg.ts`), the card renderer + lifecycle, the
scheduler, and tests. Two real gaps remained, plus one bug:
1. **Data providers were stubbed** — `main.ts` passed `getFixture: async () => null`, `getLeaderboard: () => ({traders:0,topSwing:0})`, so cards rendered with placeholder teams.
2. **No inbound** — broadcast-only. The deck calls it an "AI Pundit Bot"; a judge will open Telegram and type.
3. **Dead CTA domain** — `appUrl` fell back to `https://omnipitch.gg` (the retired codename); every card button 404'd.

We do NOT rebuild it. Close the gaps against the REAL read-models; never fabricate a score/price/rank.

## Decisions

1. **getFixture → the real `fixtures:current` hash (worker-ingest, ADR-018).** `HGET fixtures:current {matchId}` →
   parse the txline `Fixture` json → `{home, away, stage}`, respecting `Participant1IsHome`, `stage = Competition`.
   Score/minute are NOT read here — they ride the bus (`match.events`) into the card's state machine. A missing
   field → `null` → the card keeps its "Home/Away" placeholder rather than a fabricated team. (`providers.ts`)

2. **getLeaderboard → honest degrade.** The card wants a PER-MATCH `{traders, topSwing}`; the projection has neither
   (only global `lb:global` P&L by user). So `traders = ZCARD lb:global` (the real platform trader count — a true
   number, not per-match), `topSwing = 0` (no source exists). Documented in code + here; wire a per-match source
   later. Never a made-up per-match number.

3. **getMomentPng → stays `null` (honest), settle still works.** `swing-card.ts` renders an SVG from a full per-match
   mark **series** via `getMatchMarks`, but only the LATEST mark is persisted (`market:{id}`) — the series isn't
   stored anywhere reachable, and PNG rasterization (resvg) isn't installed. So the optional photo is skipped; settle
   still edits the final card + unpins. Wiring it needs a persisted series + resvg (a follow-up), not a fabrication.

4. **Inbound = long-polling `getUpdates`, NOT a webhook.** Fly gives no guaranteed public inbound path without extra
   config (a webhook needs a routed HTTPS URL + cert). Polling needs none, is trivially testable, and a single-bot
   scale never approaches the polling ceiling. `tg.ts` gains `getUpdates` + `answerCallbackQuery` on a SEPARATE
   `PollingClient` interface, so the broadcast-only `TelegramClient` (and every existing test fake of it) is
   untouched; `FetchTelegram` implements both. (`inbound.ts`)

5. **Command surface — all read-only, all play-money-safe.** `/start` (what Ninety is + app link), `/matches`
   (fixtures from `fixtures:current`, live-tagged), `/price <team>` (the current price straight from EarlyWhistle's
   in-memory live cards — same numbers as the pinned card, so bot and channel can never disagree), `/leaderboard`
   (top 5 from `lb:global`), `/help`. Unknown command → a friendly one-liner, never silence. Replies are plain text
   (zero MarkdownV2 escaping bugs) + inline-button links. Per-chat rate limit (6/10s, overflow dropped);
   `TgApiError.retryAfter` honoured on 429 (retry after the wait). (`commands.ts` pure renderers · `inbound.ts` loop)

6. **COPY LAW is enforced twice.** The copy is written clean (price · trade · credits · play-money), AND every
   outbound command string passes through `boothVoice()` (word-boundary-safe: neutralises bet/stake/odds/wager but
   leaves "Betis"/"Marseille" alone). A test asserts zero gambling vocabulary across the whole command surface.

7. **Bug fix:** `APP_URL` fallback → `https://ninety-nu.vercel.app`. Grepped worker-jobs bot copy — the only leak was
   this fallback (the other `omnipitch` hits are the on-chain crate name `programs/omnipitch_core`, legitimate).

## STEP 5 — deploy (COORDINATE; do NOT run alone)
The TxLINE go-live session also sets Fly secrets + redeploys. Two simultaneous `fly secrets set` + deploy race and one
clobbers the other's rollout. **Batch both sessions' secrets into ONE command, ONE redeploy**, announce "SECRETS SET",
let it finish before either verifies. Never commit the bot token; secret-scan first.
```
fly secrets set TELEGRAM_BOT_TOKEN=<t> EARLYWHISTLE_CHANNEL=<id> APP_URL=https://ninety-nu.vercel.app \
  TXLINE_NETWORK=devnet TXLINE_DEVNET_JWT=<jwt> TXLINE_DEVNET_API_TOKEN=<tok> -a omnipitch
```
Blocked on **B6** (owner must create the bot + channel — `docs/BLOCKERS.md`).

## Verification
- `pnpm --filter @omnipitch/worker-jobs test` — **86/86 green** (all existing suites + new `providers`/`commands`/`inbound`).
- `tsc -p .` clean.
- **Rendered-transcript proof** (until B6): the real `renderCard` + every command rendered with realistic live data
  (Canada 1–2 Morocco, 58', H/D/A prices). Read-out-loud: the card and `/price` agree on minute (58') and price
  (CAN 41.0) — they read the same in-memory card. Asserted: **zero** gambling vocabulary, **no** `omnipitch.gg` leak,
  CTA domain = `https://ninety-nu.vercel.app/match/{id}`, sanctioned vocab present.
- **Pending B6 (owner):** the real card landing in a live channel + command screenshots + `fly logs` clean. The
  integration is complete and gated; it goes live the moment a token + channel exist.
