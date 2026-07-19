// Inbound command renderers (GAP 2, ADR-085). PURE: (parsed command + already-fetched data) → a plain-text reply
// + optional inline keyboard. Plain text (no MarkdownV2) so there are zero escaping bugs; links ride inline buttons.
// COPY LAW (CLAUDE.md, legal armor): price · trade · credits · play-money — NEVER bet/stake/odds/wager/gamble. Every
// returned string is filtered through boothVoice() as defense-in-depth on top of copy that's already clean.
import { boothVoice, type CardState } from "./card";
import type { FixtureLite, TraderRow } from "./providers";

export interface Reply {
  text: string;
  reply_markup?: { inline_keyboard: Array<Array<{ text: string; url?: string }>> };
}
export interface ParsedCommand {
  cmd: string; // lower-case, no leading slash, no @botname
  arg: string;
}

export const COMMANDS = ["start", "matches", "price", "leaderboard", "help"] as const;

/** "/price@NinetyBot Canada" → { cmd: "price", arg: "Canada" }. Returns null when the text isn't a command. */
export function parseCommand(text: string): ParsedCommand | null {
  const t = text.trim();
  if (!t.startsWith("/")) return null;
  const sp = t.indexOf(" ");
  const head = (sp === -1 ? t : t.slice(0, sp)).slice(1);
  const cmd = head.split("@")[0].toLowerCase();
  const arg = sp === -1 ? "" : t.slice(sp + 1).trim();
  return { cmd, arg };
}

const safe = (s: string): string => boothVoice(s); // final copy-law pass
const hhmm = (ms: number): string => {
  const d = new Date(ms);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
};
const signedInt = (n: number): string => (n >= 0 ? "+" : "−") + Math.abs(Math.round(n)).toLocaleString("en-US");

const openBtn = (appUrl: string) => ({ inline_keyboard: [[{ text: "📲 Open Ninety", url: appUrl }]] });

export function cmdStart(appUrl: string): Reply {
  return {
    text: safe(
      "Ninety — a live football exchange for the World Cup.\n\n" +
        "Prices are probabilities. You trade match outcomes with play-money credits, priced live as the match moves and settled trustlessly on Solana. No deposits, no cash-outs — just the fastest read on the game.\n\n" +
        "Type /matches to see what's on, /price <team> for a live price, or /help for everything.",
    ),
    reply_markup: openBtn(appUrl),
  };
}

export function cmdHelp(): Reply {
  return {
    text: safe(
      "What I can do:\n" +
        "/matches — today's fixtures and which are live\n" +
        "/price <team or match> — the current live price\n" +
        "/leaderboard — the top traders by play-money credits\n" +
        "/start — what Ninety is\n" +
        "/help — this list\n\n" +
        "Prices are play-money win probabilities. You trade with credits.",
    ),
  };
}

export function cmdMatches(fixtures: FixtureLite[]): Reply {
  if (fixtures.length === 0) {
    return { text: safe("No fixtures are loaded right now — check back around kickoff.") };
  }
  const lines = fixtures.slice(0, 20).map((f) => {
    const tag = f.live ? "⚡ LIVE " : "🕑 " + hhmm(f.startTime) + " ";
    const comp = f.competition ? ` · ${f.competition}` : "";
    return `${tag}${f.home} v ${f.away}${comp}`;
  });
  return { text: safe(`Matches:\n${lines.join("\n")}\n\nTap /price <team> for a live price.`) };
}

export function cmdPrice(query: string, card: CardState | null, appUrl: string): Reply {
  if (!query) return { text: safe("Add a team or match — e.g. /price Canada. Use /matches to see what's on.") };
  if (!card) return { text: safe(`No live market for "${query}" right now. Try /matches to see what's trading.`) };
  const head = card.state === "settled" ? "🏁 Full time" : card.state === "halted" ? "🟠 Halted — repricing" : `⚡ Live ${card.minute}'`;
  const teams = `${card.home.name} ${card.score.home}–${card.score.away} ${card.away.name}`;
  const prices = card.rows.map((r) => `${r.label} ${r.price.toFixed(1)}`).join("  ·  ");
  return {
    text: safe(`${head}\n${teams}\n${prices}\n\nPrices are play-money win probabilities — trade with credits.`),
    reply_markup: { inline_keyboard: [[{ text: "📈 Trade this match", url: `${appUrl}/match/${card.matchId}` }]] },
  };
}

export function cmdLeaderboard(rows: TraderRow[]): Reply {
  if (rows.length === 0) return { text: safe("The leaderboard is warming up — no ranked traders yet. Be the first: open Ninety and trade a match.") };
  const medal = (r: number) => (r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `${r}.`);
  const lines = rows.slice(0, 5).map((t) => `${medal(t.rank)} ${t.userId}  ${signedInt(t.pnl)} credits`);
  return { text: safe(`Top traders (net play-money credits):\n${lines.join("\n")}`) };
}

export function cmdUnknown(): Reply {
  return { text: safe("I didn't catch that one. Try /help to see what I can do.") };
}
