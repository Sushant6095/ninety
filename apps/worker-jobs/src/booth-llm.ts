// BoothLLM implementations. The consumer (booth.ts) always post-processes the output (≤2 sentences, booth-voice,
// real-number guard), so a narrator only has to turn the two-role prompt into a line.
//  • AnthropicBooth — the real AI booth: one Claude call per trigger via fetch (no SDK dep). Haiku 4.5 is the right
//    tier for frequent, lightweight narration. max_tokens is capped so a call can never run long or expensive.
//  • templateBooth — deterministic fallback (no key / offline / tests-of-the-worker): composes the line from the
//    prompt's ACTION/MARKET slots. Still cites the real numbers.
import type { BoothLLM } from "./booth";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const BOOTH_MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 120; // ≤2 sentences — also the cost ceiling per trigger
const TIMEOUT_MS = 2_000; // honor the "line within 2s" target — a slow/hung call aborts and the consumer uses the fallback

export class AnthropicBooth implements BoothLLM {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly model = BOOTH_MODEL,
  ) {}

  async narrate(prompt: string): Promise<string> {
    const res = await this.fetchImpl(ANTHROPIC_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": this.apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: this.model, max_tokens: MAX_TOKENS, messages: [{ role: "user", content: prompt }] }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}`); // the consumer catches → deterministic fallback line
    const body = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    return body.content?.find((b) => b.type === "text")?.text?.trim() ?? "";
  }
}

const slot = (prompt: string, label: string): string => new RegExp(`${label}: (.*)`).exec(prompt)?.[1]?.trim() ?? "";

/** Deterministic narrator — composes the booth line from the sanitized ACTION/MARKET slots the prompt carries. */
export const templateBooth: BoothLLM = {
  async narrate(prompt: string): Promise<string> {
    const action = slot(prompt, "ACTION");
    const market = slot(prompt, "MARKET");
    const tail = market && market !== "no price move yet" ? ` ${market}.` : "";
    return `${action}.${tail}`.trim();
  },
};

/** Pick the narrator from the environment: the real Claude booth when a key is set, else the template fallback. */
export function makeBoothLLM(env: NodeJS.ProcessEnv = process.env): BoothLLM {
  return env.ANTHROPIC_API_KEY ? new AnthropicBooth(env.ANTHROPIC_API_KEY) : templateBooth;
}
