// jobs: settlement saga (settlement.ts), moment renderer (moments.ts), and EarlyWhistle live cards (52B).
// EarlyWhistle boots only when a bot token + channel are configured; readers are wired to the bus, with
// fixture/leaderboard/moment lookups left as a follow-up (Redis-backed) — see earlywhistle.ts.
import { createBus } from "@omnipitch/bus";
import { startEarlyWhistle } from "./earlywhistle";
import { startBooth } from "./booth";
import { makeBoothLLM } from "./booth-llm";
import { FetchTelegram } from "./tg";

async function main() {
  const bus = await createBus();

  // AI Booth: narrates swings + events onto commentary.v1 (→ EarlyWhistle cards, → web BoothBubble). Runs always;
  // uses the real Claude narrator when ANTHROPIC_API_KEY is set, else a deterministic template narrator.
  await startBooth({ bus, llm: makeBoothLLM() });
  console.log(JSON.stringify({ evt: "booth.ready", model: process.env.ANTHROPIC_API_KEY ? "anthropic" : "template" }));

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.EARLYWHISTLE_CHANNEL;
  if (token && channelId) {
    await startEarlyWhistle({
      bus,
      telegram: new FetchTelegram(token),
      channelId,
      appUrl: process.env.APP_URL ?? "https://omnipitch.gg",
      // TODO(follow-up): back these with Redis (fixtures:current hash, lb:global zset) + the moments renderer output.
      getFixture: async () => null,
      getLeaderboard: async () => ({ traders: 0, topSwing: 0 }),
      getMomentPng: async () => null,
    });
    console.log(JSON.stringify({ evt: "earlywhistle.ready", channel: channelId }));
  }
}
main();
