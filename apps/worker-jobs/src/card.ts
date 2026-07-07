// EarlyWhistle live match card — the PURE renderer shared by live cards and /match one-shots (52B).
// renderCard(state) has no IO and no clock: same state in → same MarkdownV2 string + keyboard out. This is
// what the golden-snapshot tests lock. Design law: numbers monospace/tabular, sentence-case copy, booth voice
// (never bet/stake/odds/wager — say price/trade/credits).

export type MatchState = "live" | "halted" | "settled";

export interface PriceRow {
  label: string; // 3-ish char outcome label (home code, "DRW", away code, or OVER/UNDER)
  price: number; // 0..100, one decimal on render (fair × 100)
  delta: number; // change vs ~4 min ago, signed
  spark: string; // 16-bucket unicode sparkline (frozen when halted)
}

export interface TeamMeta {
  name: string;
  code?: string; // 3-letter code (e.g. CAN); falls back to first 3 of name
  flag?: string; // emoji flag, optional
}

export interface CardState {
  matchId: string;
  state: MatchState;
  minute: number;
  stage: string; // "Round of 16"
  home: TeamMeta;
  away: TeamMeta;
  score: { home: number; away: number };
  marketLabel: string; // "WIN MARKET (play credits)"
  rows: PriceRow[];
  lastEvent?: string; // "38' Goal — Canada · market 41 → 63" (already booth-filtered upstream)
  booth?: string; // latest booth line (already filtered)
  traders: number;
  topSwing: number;
  updatedSecondsAgo: number;
  settled?: { result: string; sig: string; solscanUrl: string };
}

export interface CardButton {
  text: string;
  url?: string;
  callback_data?: string;
}
export interface CardRender {
  text: string;
  reply_markup: { inline_keyboard: CardButton[][] };
}

const BLOCKS = "▁▂▃▄▅▆▇█";
export const SPARK_WIDTH = 16;
const HARD_CAP = 3500;

// --- MarkdownV2 escaping ---
const MD_SPECIALS = /([_*[\]()~`>#+\-=|{}.!\\])/g;
/** Escape MarkdownV2 reserved chars in normal (non-code) text. */
export function escapeMd(s: string): string {
  return s.replace(MD_SPECIALS, "\\$1");
}
/** Inside a ``` code fence only backslash and backtick are special. */
function escapeCode(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
}

// --- booth-voice copy filter (CLAUDE.md law: never bet/stake/odds/wager) ---
const FORBIDDEN: Array<[RegExp, string]> = [
  [/\bwagers?\b/gi, "trade"],
  [/\bbets?\b/gi, "trade"],
  [/\bstakes?\b/gi, "credits"],
  [/\bodds\b/gi, "price"],
];
/** Sanitize any outbound dynamic string to the booth voice. Idempotent. */
export function boothVoice(s: string): string {
  let out = s;
  for (const [re, sub] of FORBIDDEN) out = out.replace(re, (m) => matchCase(m, sub));
  return out;
}
function matchCase(orig: string, sub: string): string {
  if (orig === orig.toUpperCase()) return sub.toUpperCase();
  if (orig[0] === orig[0]?.toUpperCase()) return sub[0].toUpperCase() + sub.slice(1);
  return sub;
}

// --- sparkline ---
/** 16-bucket unicode sparkline from a series (min→max mapped over the 8 blocks). "" if empty. */
export function sparkline(values: number[], width = SPARK_WIDTH): string {
  if (values.length === 0) return "";
  const cols: number[] = [];
  if (values.length <= width) {
    cols.push(...values);
  } else {
    for (let i = 0; i < width; i++) {
      const start = Math.floor((i * values.length) / width);
      const end = Math.max(Math.floor(((i + 1) * values.length) / width), start + 1);
      const slice = values.slice(start, end);
      cols.push(slice.reduce((a, b) => a + b, 0) / slice.length);
    }
  }
  const min = Math.min(...cols);
  const max = Math.max(...cols);
  const range = max - min || 1;
  return cols.map((v) => BLOCKS[Math.min(7, Math.floor(((v - min) / range) * 8))]).join("");
}

const arrow = (d: number): string => (d > 0.05 ? `▲${Math.abs(d).toFixed(1)}` : d < -0.05 ? `▼${Math.abs(d).toFixed(1)}` : `·${Math.abs(d).toFixed(1)}`);

function stateHeader(s: CardState): string {
  if (s.state === "halted") return "🟠 HALTED — repricing";
  if (s.state === "settled") return "🏁 FULL TIME";
  return `⚡ LIVE ${s.minute}'`;
}

/** Render the price rows as an aligned monospace ``` block (name | price | Δ | sparkline). */
function priceBlock(rows: PriceRow[]): string {
  const nameW = Math.max(3, ...rows.map((r) => r.label.length));
  const lines = rows.map((r) => {
    const name = r.label.toUpperCase().padEnd(nameW);
    const price = r.price.toFixed(1).padStart(5);
    const d = arrow(r.delta).padEnd(6);
    return escapeCode(`${name}  ${price}  ${d} ${r.spark}`);
  });
  return "```\n" + lines.join("\n") + "\n```";
}

const MAX_STAGE = 48;
const MAX_NAME = 24;
const MAX_EVENT = 200;
const MAX_BOOTH = 400;
/** Truncate RAW text (before escaping) so we never slice a MarkdownV2 escape sequence in half. */
const trunc = (s: string, n: number): string => (s.length > n ? s.slice(0, n - 1) + "…" : s);

/** Pure render: CardState → MarkdownV2 text + inline keyboard. */
export function renderCard(state: CardState, appUrl: string): CardRender {
  const hn = escapeMd(trunc(state.home.name, MAX_NAME).toUpperCase());
  const an = escapeMd(trunc(state.away.name, MAX_NAME).toUpperCase());
  const teams = `${flag(state.home.flag)}${hn} ${state.score.home} – ${state.score.away} ${an}${flag(state.away.flag, true)}`;
  const lines: string[] = [
    `${stateHeader(state)}  ·  ${escapeMd(trunc(state.stage, MAX_STAGE))}`,
    teams,
    "",
    `*${escapeMd(state.marketLabel)}*`,
    priceBlock(state.rows),
  ];
  if (state.settled) {
    lines.push("", `🏁 Result: ${escapeMd(state.settled.result)}`, `✅ proof verified on Solana`);
  } else {
    if (state.lastEvent) lines.push("", `⚽ ${escapeMd(boothVoice(trunc(state.lastEvent, MAX_EVENT)))}`);
    if (state.booth) lines.push(`🎙 "${escapeMd(boothVoice(trunc(state.booth, MAX_BOOTH)))}"`);
  }
  const swing = escapeMd((state.topSwing >= 0 ? "+" : "") + String(state.topSwing)); // escape the sign too — '+' is MdV2-reserved
  lines.push("", `👥 ${escapeMd(state.traders.toLocaleString("en-US"))} trading · 🔥 top swing ${swing}`);
  lines.push(escapeMd(`updated ${state.updatedSecondsAgo}s ago · faster than your TV`));

  let text = lines.join("\n");
  // Inputs are length-capped above, so the card sits well under HARD_CAP. If a pathological input still
  // overflows, DROP the optional booth/event lines — never slice the final string, which would cut a
  // MarkdownV2 escape (`\.`) or a ``` fence in half and break the parser.
  if (text.length > HARD_CAP) text = lines.filter((l) => !l.startsWith("🎙") && !l.startsWith("⚽")).join("\n");

  return { text, reply_markup: keyboard(state, appUrl) };
}

function keyboard(state: CardState, appUrl: string): { inline_keyboard: CardButton[][] } {
  if (state.settled) {
    return {
      inline_keyboard: [[
        { text: "🔗 Verify on Solana", url: state.settled.solscanUrl },
        { text: "📈 View match", url: `${appUrl}/match/${state.matchId}` },
      ]],
    };
  }
  return {
    inline_keyboard: [[
      { text: "📈 Trade this match", url: `${appUrl}/match/${state.matchId}` },
      { text: "🔔 Follow", callback_data: `follow:${state.matchId}` },
    ]],
  };
}

const flag = (f: string | undefined, trailing = false): string => (f ? (trailing ? ` ${f}` : `${f} `) : "");
