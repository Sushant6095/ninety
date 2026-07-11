// Profile fixtures — GET /profile/:handle. Curated rows for known traders; a deterministic synth for any other
// handle so every /profile/:handle route renders real-looking stats (nothing dead-ends). Swaps for DB aggregates.
export interface Profile {
  handle: string;
  rank: number;
  pnl: number; // net play-money P&L
  winRate: number; // 0..1
  bestSwing: number; // biggest single-position gain, credits
  streak: number; // + = win streak, − = losing streak
  trades: number;
  joined: string;
  curve: number[]; // equity over time
}

const CURATED: Record<string, Profile> = {
  "@vd": { handle: "@vd", rank: 142, pnl: 1214, winRate: 0.58, bestSwing: 2331, streak: 3, trades: 47, joined: "Jun 2026", curve: [1000, 980, 1120, 1080, 1260, 1190, 1340, 1210, 1214] },
  "@pitchwizard": { handle: "@pitchwizard", rank: 1, pnl: 18240, winRate: 0.71, bestSwing: 6120, streak: 8, trades: 210, joined: "May 2026", curve: [1000, 1600, 2400, 4100, 6800, 9200, 12800, 15600, 18240] },
  "@hexfan": { handle: "@hexfan", rank: 2, pnl: 16810, winRate: 0.66, bestSwing: 4880, streak: 5, trades: 188, joined: "May 2026", curve: [1000, 1400, 2200, 3800, 6100, 9400, 12200, 14900, 16810] },
  "@atlasfox": { handle: "@atlasfox", rank: 3, pnl: 15290, winRate: 0.64, bestSwing: 4210, streak: -2, trades: 176, joined: "May 2026", curve: [1000, 1500, 2600, 4400, 7000, 9900, 12600, 14800, 15290] },
};

// Cheap deterministic hash → stable synth for uncurated handles (never dead-ends).
const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
};

export function resolveProfile(handle: string): Profile {
  const key = ("@" + handle.replace(/^@/, "")).toLowerCase();
  const curated = CURATED[key];
  if (curated) return curated;
  const h = hash(key);
  const pnl = ((h % 24000) - 4000); // −4k..20k
  const base = 1000;
  const end = base + pnl;
  const curve = Array.from({ length: 9 }, (_, i) => Math.round(base + (end - base) * (i / 8) + ((hash(key + i) % 400) - 200)));
  curve[8] = end;
  return {
    handle: "@" + handle.replace(/^@/, ""),
    rank: 50 + (h % 900),
    pnl,
    winRate: 0.42 + (h % 34) / 100, // .42...75
    bestSwing: 600 + (h % 3800),
    streak: ((h % 11) - 5),
    trades: 20 + (h % 220),
    joined: "Jun 2026",
    curve,
  };
}
