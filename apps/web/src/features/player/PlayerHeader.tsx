import { TeamCrest } from "../../components/ui/TeamCrest";
import { PlayerPhoto } from "./PlayerPhoto";
import { ageAt, fmtDate, posLabel, stageLabel, resultToken, type PlayerProfile } from "./data";

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-label uppercase tracking-micro text-lo">{label}</span>
      <span className="truncate text-caption font-medium text-hi">{children}</span>
    </div>
  );
}

function HeadlineStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="num text-display font-semibold tabular-nums leading-none text-hi">{value}</span>
      <span className="text-label uppercase tracking-micro text-lo">{label}</span>
    </div>
  );
}

/** The previous completed match — real WC26 result. Reads out identically to the top row of the Matches table. */
function PreviousMatch({ p }: { p: PlayerProfile }) {
  const m = p.matches[0];
  if (!m || !m.score) {
    return (
      <div className="flex flex-col justify-center rounded-card border border-hairline bg-surface p-4">
        <span className="text-label uppercase tracking-micro text-lo">Previous match</span>
        <span className="mt-2 text-caption text-lo">No completed matches yet.</span>
      </div>
    );
  }
  const rt = resultToken(m.result);
  const line = (t: { code: string; name: string }, goals: number, win: boolean) => (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-2">
        <TeamCrest code={t.code} size={20} />
        <span className={`truncate text-caption ${win ? "font-semibold text-hi" : "text-lo"}`}>{t.name}</span>
      </span>
      <span className={`num text-caption tabular-nums ${win ? "font-semibold text-hi" : "text-lo"}`}>{goals}</span>
    </div>
  );
  const homeWin = m.score.winner === "HOME_TEAM";
  const awayWin = m.score.winner === "AWAY_TEAM";
  return (
    <div className="flex flex-col rounded-card border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-label uppercase tracking-micro text-lo">Previous match</span>
        <span className="text-label uppercase tracking-micro text-lo">
          World Cup · {stageLabel(m.stage)}
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {line(m.home, m.score.h, homeWin)}
        {line(m.away, m.score.a, awayWin)}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-2">
        <span className="text-label text-lo">{fmtDate(m.date)} · FT</span>
        <span className={`rounded-chip px-2 py-0.5 text-label font-semibold ${rt.cls} ring-1 ring-inset ring-hairline`}>{rt.label}</span>
      </div>
    </div>
  );
}

export function PlayerHeader({ p }: { p: PlayerProfile }) {
  const age = ageAt(p.dob);
  return (
    <header className="elev grid gap-5 rounded-card border border-hairline bg-surface p-5 lg:grid-cols-[1.4fr_1fr] lg:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4 sm:gap-5">
          <PlayerPhoto name={p.name} photo={p.photo} nat={p.nat} size={96} priority />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-caption text-lo">
              <TeamCrest code={p.nat} size={18} />
              <span className="truncate">{p.natName ?? p.nat}</span>
              <span aria-hidden>·</span>
              <span className="num tabular-nums">#{p.rank}</span>
              <span className="truncate">scorer · World Cup 2026</span>
            </div>
            <h1 className="mt-1 truncate text-[1.9rem] font-semibold leading-tight tracking-tight text-hi sm:text-[2.25rem]">{p.name}</h1>
            <div className="mt-3 flex items-end gap-6">
              <HeadlineStat label="Goals" value={p.goals} />
              <HeadlineStat label="Assists" value={p.assists} />
              <HeadlineStat label="Matches" value={p.playedMatches} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-hairline pt-4 sm:grid-cols-4">
          <Meta label="Country">
            <span className="inline-flex items-center gap-1.5">
              <TeamCrest code={p.nat} size={16} />
              {p.natName ?? p.nat}
            </span>
          </Meta>
          <Meta label="Born">
            <span className="num tabular-nums">{p.dob ? fmtDate(p.dob) : "—"}</span>
            {age != null && <span className="num tabular-nums text-lo"> ({age})</span>}
          </Meta>
          <Meta label="Position">{posLabel(p.pos)}</Meta>
          <Meta label="Penalties">
            <span className="num tabular-nums">{p.penalties}</span>
            <span className="text-lo"> of {p.goals} goals</span>
          </Meta>
          {p.shirt != null && (
            <Meta label="Shirt">
              <span className="num tabular-nums">#{p.shirt}</span>
            </Meta>
          )}
        </div>
      </div>
      <PreviousMatch p={p} />
    </header>
  );
}
