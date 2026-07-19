import Image from "next/image";
import { TeamCrest } from "../../../components/ui/TeamCrest";
import { LINEUPS, type Lineup } from "../../../lib/matchdepth";
import { squadByCode, managerByCode, teamMediaByCode, type PlayerMedia } from "../../../lib/teamMedia";

// Two-source law (ADR-051/ADR-062): the confirmed starting XI + formation MOVE with team news, so they come from
// API-Football at wire time (currently BLOCKED · no key). What sits still is the SQUAD and each player's FACE,
// baked from TheSportsDB. So this tab renders the real squad on the native SVG pitch, positioned by TheSportsDB
// position, and says plainly that the confirmed XI is pending · never an empty tab, never a faked lineup.

// GK 0 (bottom) · DEF 1 · MID 2 · FWD 3 (top) on a portrait pitch.
const Y_BY_ROW = [88, 64, 40, 16];
function bucket(pos: string): 0 | 1 | 2 | 3 {
  if (/goalkeeper|keeper/i.test(pos)) return 0;
  if (/back|defen/i.test(pos)) return 1;
  if (/wing|forward|strik/i.test(pos)) return 3;
  return 2; // midfield + anything unlabelled
}
const surname = (n: string) => n.split(" ").filter(Boolean).slice(-1)[0] ?? n;

// pitch markings · hairline only, no grass (tokens). Shared by both the faces pitch and the dot fallback.
function Markings() {
  return (
    <svg viewBox="0 0 100 150" className="absolute inset-0 h-full w-full" fill="none" stroke="var(--hairline)" strokeWidth="0.6" aria-hidden preserveAspectRatio="none">
      <rect x="2" y="2" width="96" height="146" rx="2" />
      <line x1="2" y1="75" x2="98" y2="75" />
      <circle cx="50" cy="75" r="11" />
      <rect x="26" y="2" width="48" height="22" />
      <rect x="26" y="126" width="48" height="22" />
      <rect x="40" y="2" width="20" height="8" />
      <rect x="40" y="140" width="20" height="8" />
    </svg>
  );
}

function PitchHeader({ code, right }: { code: string; right: React.ReactNode }) {
  const jersey = teamMediaByCode(code)?.jersey ?? null;
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="flex items-center gap-2">
        <TeamCrest code={code} size={22} />
        {/* kit-colour accent: the real jersey, straight off the bake */}
        {jersey && <Image src={jersey} alt={`${code} kit`} width={20} height={20} className="h-5 w-5 object-contain" />}
        <span className="text-strong font-semibold text-hi">{code}</span>
      </span>
      <span className="num text-caption font-semibold tabular-nums text-lo">{right}</span>
    </div>
  );
}

// Real faces from TheSportsDB, bucketed onto the pitch by position.
function FacesPitch({ code, squad, manager }: { code: string; squad: PlayerMedia[]; manager: PlayerMedia | null }) {
  const rows: PlayerMedia[][] = [[], [], [], []];
  for (const p of squad) rows[bucket(p.pos)].push(p);
  const placed = rows.flatMap((row, r) =>
    row.map((p, j) => ({ p, x: (100 * (j + 1)) / (row.length + 1), y: Y_BY_ROW[r] })),
  );
  return (
    <div className="rounded-card border border-hairline bg-surface p-3">
      <PitchHeader code={code} right="Squad" />
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-bg">
        <Markings />
        {placed.map(({ p, x, y }) => (
          <span key={p.slug} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5" style={{ left: `${x}%`, top: `${y}%` }}>
            <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-surface ring-1 ring-inset ring-hairline">
              <Image src={p.file} alt={p.name} width={32} height={32} className="h-full w-full object-cover" />
            </span>
            <span className="max-w-16 truncate text-label leading-none text-hi/90">{surname(p.name)}</span>
          </span>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-label text-lo">Confirmed XI &amp; formation pending live data</span>
        {manager && <span className="num text-label tabular-nums text-lo">Coach · {manager.name}</span>}
      </div>
    </div>
  );
}

// Fallback: the illustrative formation dot-pitch, for any team TheSportsDB hasn't matched.
function positions(l: Lineup): { num: number; name: string; x: number; y: number }[] {
  const out: { num: number; name: string; x: number; y: number }[] = [];
  const rc = l.rows.length;
  let idx = 0;
  l.rows.forEach((n, i) => {
    const yUnits = 138 - i * (120 / Math.max(1, rc - 1));
    for (let j = 0; j < n; j++) {
      const p = l.xi[idx++];
      if (p) out.push({ num: p.num, name: p.name, x: (100 * (j + 1)) / (n + 1), y: (yUnits / 150) * 100 });
    }
  });
  return out;
}
function DotPitch({ l }: { l: Lineup }) {
  return (
    <div className="rounded-card border border-hairline bg-surface p-3">
      <PitchHeader code={l.code} right={l.formation} />
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-bg">
        <Markings />
        {positions(l).map((p) => (
          <span key={p.num} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <span className="num grid h-6 w-6 place-items-center rounded-full bg-hairline text-label font-bold tabular-nums text-hi ring-1 ring-inset ring-hairline">{p.num}</span>
            <span className="max-w-14 truncate text-label leading-none text-lo">{p.name}</span>
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

// Prefer the real faces pitch when TheSportsDB has a squad for the side; else the illustrative dot-pitch.
function Side({ l }: { l: Lineup }) {
  const squad = squadByCode(l.code);
  if (squad.length >= 5) return <FacesPitch code={l.code} squad={squad} manager={managerByCode(l.code)} />;
  return <DotPitch l={l} />;
}

// Honest "pending" pitch for a side TheSportsDB hasn't baked a squad for · never a faked XI (ADR-051/ADR-062).
function PendingPitch({ code }: { code: string }) {
  return (
    <div className="rounded-card border border-hairline bg-surface p-3">
      <PitchHeader code={code} right="Squad" />
      <div className="relative grid aspect-[2/3] w-full place-items-center overflow-hidden rounded-md bg-bg">
        <Markings />
        <span className="relative max-w-[22ch] px-4 text-center text-label leading-relaxed text-lo">Squad &amp; confirmed XI pending live data</span>
      </div>
    </div>
  );
}

/** Lineups for an arbitrary match, addressed by team code only (no hand-written LINEUPS fixture): the real baked
 *  squad on the pitch when TheSportsDB has it, an honest "pending" pitch otherwise. Used by non-featured matches. */
export function SquadPitch({ code }: { code: string }) {
  const squad = squadByCode(code);
  if (squad.length >= 5) return <FacesPitch code={code} squad={squad} manager={managerByCode(code)} />;
  return <PendingPitch code={code} />;
}

export function Lineups() {
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2">
      <Side l={LINEUPS.home} />
      <Side l={LINEUPS.away} />
    </div>
  );
}
