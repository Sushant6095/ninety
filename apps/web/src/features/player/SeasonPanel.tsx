import { resultToken, type PlayerProfile } from "./data";

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col rounded-card border border-hairline bg-bg/40 p-3">
      <span className="num text-display font-semibold tabular-nums leading-none text-hi">{value}</span>
      <span className="mt-1 text-label uppercase tracking-micro text-lo">{label}</span>
      {sub && <span className="text-label text-lo">{sub}</span>}
    </div>
  );
}

export function SeasonPanel({ p }: { p: PlayerProfile }) {
  const pm = p.playedMatches || 0;
  const per = (n: number) => (pm > 0 ? (n / pm).toFixed(2) : "—");
  // oldest → newest for the run strip
  const run = [...p.matches].reverse();
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Tile label="Goals" value={String(p.goals)} />
        <Tile label="Assists" value={String(p.assists)} />
        <Tile label="Matches" value={String(p.playedMatches)} />
        <Tile label="Penalties" value={String(p.penalties)} />
        <Tile label="Goals / match" value={per(p.goals)} />
        <Tile label="G+A / match" value={per(p.goals + p.assists)} />
      </div>

      {run.length > 0 && (
        <div>
          <span className="text-label uppercase tracking-micro text-lo">Tournament run</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {run.map((m) => {
              const rt = resultToken(m.result);
              return (
                <span
                  key={m.id}
                  title={`${m.home.code} ${m.score ? m.score.h : "-"}–${m.score ? m.score.a : "-"} ${m.away.code}`}
                  className={`num grid h-7 w-7 place-items-center rounded-md text-label font-semibold tabular-nums ring-1 ring-inset ring-hairline ${rt.cls}`}
                >
                  {rt.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-label text-lo">
        World Cup 2026 production only. Season/career club aggregates aren&apos;t on our data tier and are omitted rather than guessed.
      </p>
    </div>
  );
}
