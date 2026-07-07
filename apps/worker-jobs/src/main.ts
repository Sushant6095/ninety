// jobs: settlement saga (settlement.ts), moment renderer (moments.ts), and EarlyWhistle live cards (52B).
// EarlyWhistle boots only when a bot token + channel are configured; readers are wired to the bus, with
// fixture/leaderboard/moment lookups left as a follow-up (Redis-backed) — see earlywhistle.ts.
import { createBus } from "@omnipitch/bus";
import { startEarlyWhistle } from "./earlywhistle";
import { FetchTelegram } from "./tg";

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.EARLYWHISTLE_CHANNEL;
  if (token && channelId) {
    const bus = await createBus();
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
