// Post-LLM safety filter for booth commentary. booth-voice is law: bet/stake/odds/wager/gamble must never reach
// product copy. Mechanism (Phase 4): detect forbidden vocabulary → the consumer regenerates ONCE → if the second
// output still contains it, DROP the line (publish nothing) rather than emit a violation. Plus a hard length clamp
// for the bubble/TTS. TTS is an OPTIONAL env-gated seam — text-first always works with no TTS configured.

// Whole-word, case-insensitive. Covers the five roots + their common inflections.
export const FORBIDDEN =
  /\b(bet|bets|betting|bettor|stake|stakes|staking|odds|wager|wagers|wagered|wagering|gamble|gambles|gambled|gambling|gambler)\b/i;

export function containsForbidden(s: string): boolean {
  return FORBIDDEN.test(s);
}

// A corrective instruction appended to the prompt for the single regeneration attempt.
export const REGEN_SUFFIX =
  "\n\nYour previous line used a forbidden word. Rewrite it WITHOUT any of: bet, stake, odds, wager, gamble. Say price, trade, or credits.";

export const MAX_CHARS = 240; // hard clamp for the bubble + TTS (after the ≤2-sentence clamp)

/** Clamp to MAX_CHARS on a word boundary, adding an ellipsis. Idempotent for short strings. */
export function clampLength(s: string, max = MAX_CHARS): string {
  const t = s.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

/**
 * Optional booth TTS. When configured (BOOTH_TTS), an impl synthesizes the line (streaming) and pushes waveform
 * state to the bubble via `matchId`'s booth channel. The default is none — commentary is text-first and never
 * blocks or depends on audio. `speak` must never throw into the consumer (fire-and-forget, best-effort).
 */
export interface BoothTTS {
  speak(text: string, matchId: string): Promise<void>;
}

export const ttsEnabled = (env: NodeJS.ProcessEnv = process.env): boolean => env.BOOTH_TTS === "1" || env.BOOTH_TTS === "true";
