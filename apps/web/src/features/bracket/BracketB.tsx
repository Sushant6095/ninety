"use client";
import { useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { GAMES, stadiumById, type WcGame } from "../../data/wc26";

// Path B — hand-rolled. The real knockout tree, DERIVED from worldcup26's placeholder labels
// ("Winner Match 101"): every knockout label that references another match is an edge, so the
// bracket builds itself. ADR-051: knockout teams are NEVER resolved from worldcup26 (results are
// TxLINE's) — we render the static labels.
//
// Design call: a full 32-team two-sided bracket does not fit a desktop viewport with readable
// nodes. So the converging tree is the ROAD TO THE FINAL (R16 → Final ← R16) — symmetric, fits,
// Final as the one hero — and the Round of 32 sits below as a quiet grid. Subtract, then elevate.

const KO = GAMES.filter((g) => g.type !== "group");
const BY_ID = new Map(KO.map((g) => [g.id, g]));

/** "Winner Match 101" -> "101"; group labels ("Runner-up Group A") -> null (an R32 leaf). */
const matchRef = (label: string | null): string | null => {
  const m = label?.match(/Match (\d+)/);
  return m ? m[1] : null;
};

const feeders = (g: WcGame): WcGame[] | null => {
  const h = matchRef(g.homeLabel);
  const a = matchRef(g.awayLabel);
  if (!h || !a) return null;
  return [BY_ID.get(h), BY_ID.get(a)].filter(Boolean) as WcGame[];
};

/** Rounds for one half, rooted at a semi-final: [R32(8), R16(4), QF(2), SF(1)]. */
function halfRounds(rootId: string): WcGame[][] {
  const root = BY_ID.get(rootId);
  if (!root) return [];
  const rounds: WcGame[][] = [[root]];
  let level = [root];
  for (;;) {
    const next: WcGame[] = [];
    for (const m of level) {
      const kids = feeders(m);
      if (kids) next.push(...kids);
    }
    if (!next.length) break;
    rounds.unshift(next);
    level = next;
  }
  return rounds;
}

const LEFT = halfRounds("101").slice(1); // drop R32 -> [R16, QF, SF]
const RIGHT = halfRounds("102").slice(1);
const R32 = KO.filter((g) => g.type === "r32");
const FINAL = BY_ID.get("104");
const THIRD = BY_ID.get("103");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDay = (kickoff: string): string => {
  const [mm, dd] = kickoff.split(" ")[0].split("/");
  return `${Number(dd)} ${MONTHS[Number(mm) - 1] ?? ""}`;
};
const fmtTime = (kickoff: string): string => kickoff.split(" ")[1] ?? "";

const ROUND_LABEL: Record<string, string> = { r16: "Round of 16", qf: "Quarter-finals", sf: "Semi-finals" };

function MatchNode({ g }: { g: WcGame }) {
  const st = stadiumById(g.stadiumId);
  return (
    <div className="elev rounded-card border border-hairline bg-surface px-3 py-2 transition-colors duration-200 hover:border-hairline hover:bg-hairline/15">
      <div className="flex items-center justify-between">
        <span className="num text-label tabular-nums text-lo">M{g.id}</span>
        <span className="num text-label tabular-nums text-lo">{fmtDay(g.kickoff)}</span>
      </div>
      <p className="mt-1 text-caption leading-tight text-hi">{g.homeLabel}</p>
      <p className="text-caption leading-tight text-hi">{g.awayLabel}</p>
      {st ? <p className="mt-1 truncate text-label text-lo">{st.city}</p> : null}
    </div>
  );
}

/** Bracket elbows — borders only, no SVG, no library. */
function Elbows({ pairs, side }: { pairs: number; side: "left" | "right" }) {
  return (
    <div className="flex w-5 shrink-0 flex-col justify-around py-1">
      {Array.from({ length: pairs }).map((_, i) => (
        <span
          key={i}
          className={`block flex-1 border-y border-hairline/60 ${side === "left" ? "rounded-r-md border-r" : "rounded-l-md border-l"}`}
        />
      ))}
    </div>
  );
}

function RoundColumn({ matches, label }: { matches: WcGame[]; label: string }) {
  return (
    <div className="flex min-w-[150px] flex-1 flex-col">
      <div className="mb-2 text-center text-label font-semibold uppercase tracking-label text-lo">{label}</div>
      <div className="flex flex-1 flex-col justify-around gap-2">
        {matches.map((g) => (
          <MatchNode key={g.id} g={g} />
        ))}
      </div>
    </div>
  );
}

/** The Final — the one hero on this screen. */
function FinalNode({ g }: { g: WcGame }) {
  const st = stadiumById(g.stadiumId);
  return (
    <div className="elev rounded-card border border-hairline bg-surface p-5 text-center ring-1 ring-inset ring-hairline">
      <span className="text-label font-semibold uppercase tracking-banner text-lo">The Final</span>
      <p className="num mt-1 text-caption tabular-nums text-lo">
        {fmtDay(g.kickoff)} 2026 · {fmtTime(g.kickoff)}
      </p>
      <div className="mt-4 space-y-1">
        <p className="font-display text-strong font-bold leading-tight text-hi">{g.homeLabel}</p>
        <p className="text-label uppercase tracking-hero text-lo">v</p>
        <p className="font-display text-strong font-bold leading-tight text-hi">{g.awayLabel}</p>
      </div>
      {st ? (
        <p className="mt-4 border-t border-hairline pt-3 text-caption leading-relaxed text-lo">
          <span className="text-hi">{st.name}</span>
          <br />
          {st.city} · {st.capacity.toLocaleString("en-US")} seats
        </p>
      ) : null}
    </div>
  );
}

export function BracketB() {
  const scope = useRef<HTMLElement>(null);

  // Reveal the rounds on load: the tree converges on the Final, so the rounds rise inward (R16 → QF → SF)
  // and the Final lands LAST as the one hero, then the R32 feeders fill below. Transform/opacity only.
  // Reduced motion leaves everything in place — the no-preference branch never runs, so the bracket
  // (real content, must read without JS too) is never hidden.
  useGSAP(
    () => {
      const pick = (sel: string): Element[] => (scope.current ? Array.from(scope.current.querySelectorAll(sel)) : []);
      const r16 = pick('[data-round="r16"]');
      const qf = pick('[data-round="qf"]');
      const sf = pick('[data-round="sf"]');
      const finale = pick('[data-round="final"]');
      const grid = pick('[data-round="r32grid"]')[0];
      const r32 = grid ? Array.from(grid.children) : [];

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap
          .timeline()
          .from(r16, { autoAlpha: 0, y: 12, duration: 0.35, stagger: 0.05 }, 0)
          .from(qf, { autoAlpha: 0, y: 12, duration: 0.35, stagger: 0.05 }, "-=0.2")
          .from(sf, { autoAlpha: 0, y: 12, duration: 0.35 }, "-=0.2")
          .from(finale, { autoAlpha: 0, y: 12, scale: 0.985, duration: 0.4, stagger: 0.08 }, "-=0.15")
          .from(r32, { autoAlpha: 0, y: 10, duration: 0.3, stagger: 0.03 }, "-=0.1");
      });
    },
    { scope, dependencies: [] },
  );

  return (
    <main ref={scope} className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-display font-bold tracking-tight text-hi">The bracket</h1>
        <p className="mt-1 text-body text-lo">
          The road to the Final on 19 July. Slots fill as the group stage settles — results come from the live feed,
          never from the calendar.
        </p>
      </div>

      {/* The road to the final: R16 → Final ← R16 */}
      <div className="overflow-x-auto pb-2" tabIndex={0} role="group" aria-label="Knockout bracket — scroll horizontally">
        <div className="flex min-w-[1120px] items-stretch gap-1">
          {LEFT.map((col, i) => (
            <div key={`L${i}`} data-round={col[0].type} className="flex flex-1 items-stretch">
              <RoundColumn matches={col} label={ROUND_LABEL[col[0].type] ?? col[0].type} />
              {i < LEFT.length - 1 ? <Elbows pairs={col.length / 2} side="left" /> : null}
            </div>
          ))}

          <div data-round="final" className="flex w-[220px] shrink-0 flex-col justify-center gap-4 px-3">
            {FINAL ? <FinalNode g={FINAL} /> : null}
            {THIRD ? (
              <div className="rounded-card border border-hairline bg-surface px-3 py-2.5 text-center">
                <span className="text-label font-semibold uppercase tracking-label text-lo">Third place</span>
                <p className="mt-1 text-caption leading-tight text-hi">{THIRD.homeLabel}</p>
                <p className="text-caption leading-tight text-hi">{THIRD.awayLabel}</p>
                <p className="num mt-1 text-label tabular-nums text-lo">{fmtDay(THIRD.kickoff)}</p>
              </div>
            ) : null}
          </div>

          {[...RIGHT].reverse().map((col, i, arr) => (
            <div key={`R${i}`} data-round={col[0].type} className="flex flex-1 items-stretch">
              {i > 0 ? <Elbows pairs={arr[i - 1].length} side="right" /> : null}
              <RoundColumn matches={col} label={ROUND_LABEL[col[0].type] ?? col[0].type} />
            </div>
          ))}
        </div>
      </div>

      {/* Round of 32 — the 16 matches that feed the tree above. Quiet, secondary. */}
      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-label font-semibold uppercase tracking-label text-lo">Round of 32</h2>
          <span className="num text-label tabular-nums text-lo">{R32.length} matches · 28 Jun – 3 Jul</span>
        </div>
        <div data-round="r32grid" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {R32.map((g) => (
            <MatchNode key={g.id} g={g} />
          ))}
        </div>
      </section>
    </main>
  );
}
