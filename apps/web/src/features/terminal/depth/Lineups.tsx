import { Flag } from "../../../components/ui/Flag";
import { LINEUPS, type Lineup } from "../../../lib/matchdepth";

// Compute each player's % position on a portrait pitch from the formation rows (GK row first, bottom → attack up).
function positions(l: Lineup): { num: number; name: string; x: number; y: number }[] {
  const out: { num: number; name: string; x: number; y: number }[] = [];
  const rc = l.rows.length;
  let idx = 0;
  l.rows.forEach((n, i) => {
    const yUnits = 138 - i * (120 / Math.max(1, rc - 1)); // 0..150 domain
    for (let j = 0; j < n; j++) {
      const p = l.xi[idx++];
      if (p) out.push({ num: p.num, name: p.name, x: (100 * (j + 1)) / (n + 1), y: (yUnits / 150) * 100 });
    }
  });
  return out;
}

function Pitch({ l, tone }: { l: Lineup; tone: "up" | "down" }) {
  const dot = tone === "up" ? "bg-up/20 text-hi ring-up/50" : "bg-down/20 text-hi ring-down/50";
  return (
    <div className="rounded-card border border-hairline bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2"><Flag code={l.code} size={18} /><span className="text-strong font-semibold text-hi">{l.code}</span></span>
        <span className="num text-caption font-semibold tabular-nums text-lo">{l.formation}</span>
      </div>
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-bg">
        {/* pitch markings — hairline only, no grass (tokens) */}
        <svg viewBox="0 0 100 150" className="absolute inset-0 h-full w-full" fill="none" stroke="var(--hairline)" strokeWidth="0.6" aria-hidden preserveAspectRatio="none">
          <rect x="2" y="2" width="96" height="146" rx="2" />
          <line x1="2" y1="75" x2="98" y2="75" />
          <circle cx="50" cy="75" r="11" />
          <rect x="26" y="2" width="48" height="22" />
          <rect x="26" y="126" width="48" height="22" />
          <rect x="40" y="2" width="20" height="8" />
          <rect x="40" y="140" width="20" height="8" />
        </svg>
        {positions(l).map((p) => (
          <span key={p.num} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <span className={`num grid h-6 w-6 place-items-center rounded-full text-label font-bold tabular-nums ring-1 ring-inset ${dot}`}>{p.num}</span>
            <span className="max-w-[52px] truncate text-[9px] leading-none text-lo">{p.name}</span>
          </span>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5">
        <span className="text-label font-semibold uppercase tracking-wide text-lo">Subs</span>
        {l.subs.map((s) => <span key={s.num} className="num text-label tabular-nums text-lo">{s.num} {s.name}</span>)}
      </div>
    </div>
  );
}

export function Lineups() {
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2">
      <Pitch l={LINEUPS.home} tone="up" />
      <Pitch l={LINEUPS.away} tone="down" />
    </div>
  );
}
