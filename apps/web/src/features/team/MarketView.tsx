import Link from "next/link";
import { EquityCurve } from "../../components/ui/EquityCurve";
import { fmtPrice, signedPct } from "../../lib/format";
import { MOMENTS, swingOf, rarityOf, type Moment } from "../../lib/moments";
import { SideCrest } from "./Crest";
import { resultToken, opponentOf, type TeamProfile } from "./data";

/** Market moments involving this team — team-level (never attributed to one player's goal, which we can't source).
 *  Nations key on their FIFA code; clubs have no modeled market → empty. Biggest absolute swing first. */
function momentsForTeam(t: TeamProfile): Moment[] {
  const code = t.fifaCode?.toUpperCase();
  if (!code) return [];
  return MOMENTS.filter((m) => m.homeCode === code || m.awayCode === code).sort((a, b) => Math.abs(swingOf(b)) - Math.abs(swingOf(a)));
}

// The opponent code in a moment, from this team's perspective.
const oppOfMoment = (m: Moment, code: string): string => (m.homeCode === code ? m.awayCode : m.homeCode);

/** The real full-time result of this team's match against `oppCode`, if it finished — the "reality" half of
 *  market-vs-reality. Joined by opponent code against the baked matches; null when no finished match matches. */
function realityFor(t: TeamProfile, oppCode: string): { h: number; a: number; result: "W" | "L" | "D" | null } | null {
  const m = t.matches.find((x) => x.score && opponentOf(x).code === oppCode);
  if (!m || !m.score) return null;
  const mine = m.side === "home" ? m.score.h : m.score.a;
  const theirs = m.side === "home" ? m.score.a : m.score.h;
  return { h: mine, a: theirs, result: m.result };
}

export function MarketView({ t }: { t: TeamProfile }) {
  const moments = momentsForTeam(t);
  const label = t.shortName ?? t.name;
  return (
    <section className="elev rounded-card border border-hairline bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-strong font-semibold text-hi">Market view</h2>
        <span className="text-label uppercase tracking-micro text-lo">price is probability</span>
      </div>
      <p className="mt-1 text-caption text-lo">
        How Ninety&apos;s market — a live win probability — moved in {label}&apos;s matches. The one panel a stats site can&apos;t show, because they don&apos;t run a market. Modeled at team level, priced in credits.
      </p>

      {moments.length === 0 ? (
        <p className="mt-4 rounded-card border border-dashed border-hairline p-4 text-caption text-lo">
          No market-moving moments modeled for {label} yet — the market view lights up once one of their matches reprices on the River.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {moments.map((m) => {
            const swing = swingOf(m);
            const up = swing >= 0;
            const oppCode = oppOfMoment(m, t.fifaCode!.toUpperCase());
            const reality = realityFor(t, oppCode);
            const rt = reality ? resultToken(reality.result) : null;
            return (
              <li key={m.id}>
                <Link
                  href={`/moments/${m.id}`}
                  className="group block rounded-card border border-hairline bg-bg/40 p-3 transition-colors duration-200 hover:border-up/40 hover:bg-hairline/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-up/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="num text-label font-semibold tabular-nums text-lo">{m.minute}&#39;</span>
                      <SideCrest code={m.homeCode} size={16} />
                      <SideCrest code={m.awayCode} size={16} />
                      <span className="truncate text-caption font-medium text-hi">{m.title}</span>
                    </span>
                    <span className={`num shrink-0 text-caption font-semibold tabular-nums ${up ? "text-up" : "text-down"}`}>{signedPct(swing)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="w-24 shrink-0">
                      <EquityCurve values={m.segment} up={up} height={28} />
                    </span>
                    <span className="num text-caption tabular-nums text-lo">
                      {m.pick} {fmtPrice(m.fromPrice)} → <span className="text-hi">{fmtPrice(m.toPrice)}</span>
                    </span>
                    <span className="ml-auto text-label uppercase tracking-micro text-lo">{rarityOf(m)}</span>
                  </div>
                  {/* Market vs reality — the price the market gave, and how the match actually finished. */}
                  {reality && rt && (
                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-hairline pt-2">
                      <span className="text-label uppercase tracking-micro text-lo">Market → reality</span>
                      <span className="num text-label tabular-nums text-lo">
                        final {reality.h}–{reality.a} <span className={`font-semibold ${rt.cls}`}>{rt.label}</span>
                      </span>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
