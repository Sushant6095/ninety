import { TEAMS } from "../../data/wc26";
import { TeamCrest } from "../../components/ui/TeamCrest";

// The wall of nations — all 48 qualified teams as their REAL crests (baked local, public/teams/*/badge.png
// via TheSportsDB, ADR-062), arranged as the ACTUAL DRAW: 12 groups of 4.
//
// Replaces the dotted WorldGlobe that used to sit here. The globe was the coldest thing on the page — a
// generic tech sphere any SaaS site ships — and it illustrated nothing the stats didn't already say. The
// crests illustrate "48 · teams, every one a market" literally, cost no WebGL, and render on mobile, which
// the lg-only globe never did.
//
// Why grouped and not one flat 6x8 grid: a uniform grid at equal weight is a sticker sheet — it shows 48
// logos but says nothing. The group is the unit a fan actually navigates ("who's in our group?"), so the
// gutters + the group letter carry real structure that no template logo-cloud has. Football-native, from
// data we already hold (teams.json `group`), not decoration.
//
// Subordination rule (CLAUDE.md): texture, never a gallery. Crests rest held-back so the stat numbers stay
// the loudest thing in the section; they only come up to full under a pointer.

interface Group {
  letter: string;
  codes: string[];
}

const GROUPED: Group[] = Object.entries(
  TEAMS.reduce<Record<string, string[]>>((acc, t) => {
    const g = t.group ?? "?";
    (acc[g] ??= []).push(t.code);
    return acc;
  }, {}),
)
  .map(([letter, codes]) => ({ letter, codes }))
  .sort((a, b) => a.letter.localeCompare(b.letter));

export function CrestWall({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Floodlight: one pool of the signature green over the wall, the way a stand reads under lights.
          Tokens only — color-mix over --up, the same construction as the orb tokens. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 -z-10 blur-2xl"
        style={{
          background:
            "radial-gradient(55% 40% at 50% 8%, color-mix(in srgb, var(--up) 26%, transparent), transparent 72%)",
        }}
      />
      <ul aria-label="All 48 qualified teams, by group" className="grid grid-cols-4 gap-x-3 gap-y-3 sm:gap-x-4 lg:grid-cols-3">
        {GROUPED.map((g) => (
          <li key={g.letter}>
            <p className="num mb-1 text-label font-semibold uppercase tracking-caps text-lo/70">{g.letter}</p>
            <div className="grid grid-cols-2 gap-1 rounded-md p-1 ring-1 ring-inset ring-hairline/50">
              {g.codes.map((code) => (
                <span
                  key={code}
                  className="flex aspect-square items-center justify-center rounded transition-[transform,opacity] duration-200 ease-out hover:opacity-100 motion-reduce:transition-none md:opacity-80 md:hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
                >
                  {/* size is applied inline by TeamCrest, so it must be a number — a % className is inert here */}
                  <TeamCrest code={code} size={26} />
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
