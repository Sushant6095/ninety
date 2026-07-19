// jobs: settlement saga (settlement.ts), moment renderer (moments.ts), and EarlyWhistle live cards + inbound bot
// (52B / ADR-085). EarlyWhistle boots only when a bot token + channel are configured; its readers are wired to the
// real Redis read-models (fixtures:current, lb:global) — see providers.ts. Inbound commands run alongside on a
// getUpdates long-poll (inbound.ts). Everything read-only + play-money.
import Redis from "ioredis";
import { createBus } from "@omnipitch/bus";
import { startEarlyWhistle } from "./earlywhistle";
import { startInbound } from "./inbound";
import { makeGetFixture, makeGetLeaderboardStat } from "./providers";
import { startBooth } from "./booth";
import { makeBoothLLM } from "./booth-llm";
import { FetchTelegram } from "./tg";
import type { CardState } from "./card";

// The live site. NOT the retired "omnipitch.gg" codename — every card CTA and bot link points here.
const APP_URL = process.env.APP_URL ?? "https://ninety-nu.vercel.app";

async function main() {
  const bus = await createBus();

  // AI Booth: narrates swings + events onto commentary.v1 (→ EarlyWhistle cards, → web BoothBubble). Runs always;
  // uses the real Claude narrator when ANTHROPIC_API_KEY is set, else a deterministic template narrator.
  await startBooth({ bus, llm: makeBoothLLM() });
  console.log(JSON.stringify({ evt: "booth.ready", model: process.env.ANTHROPIC_API_KEY ? "anthropic" : "template" }));

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.EARLYWHISTLE_CHANNEL;
  if (token && channelId) {
    const telegram = new FetchTelegram(token);
    const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

    const ew = await startEarlyWhistle({
      bus,
      telegram,
      channelId,
      appUrl: APP_URL,
      getFixture: makeGetFixture(redis), // real: fixtures:current hash (worker-ingest)
      getLeaderboard: makeGetLeaderboardStat(redis), // honest degrade: ZCARD lb:global; per-match traders/swing not tracked yet (ADR-085)
      // getMomentPng omitted (→ null): the swing renderer needs a persisted per-match mark SERIES that isn't stored,
      // and PNG rasterization (resvg) isn't installed (ADR-085). Settle still edits + unpins; the photo is skipped.
    });
    console.log(JSON.stringify({ evt: "earlywhistle.ready", channel: channelId }));

    // /price reads the current price straight from EarlyWhistle's live in-memory cards — same numbers the pinned card
    // shows, so the bot and the channel can never disagree (the read-out-loud guarantee).
    const priceLookup = (query: string): CardState | null => {
      const q = query.trim().toLowerCase();
      if (!q) return null;
      for (const card of ew.cards.values()) {
        const st = card.toCardState(Date.now(), { traders: 0, topSwing: 0 });
        if (st.home.name.toLowerCase().includes(q) || st.away.name.toLowerCase().includes(q)) return st;
      }
      return null;
    };
    startInbound({ telegram, appUrl: APP_URL, redis, priceLookup });
    console.log(JSON.stringify({ evt: "inbound.ready", channel: channelId }));
  }
}
main();
