"use client";
import { useMemo, useState } from "react";
import { SideCrest } from "./Crest";
import { byCompetition, fmtDate, fmtKickoff, stageLabel, resultToken, isFinished, type TeamProfile, type TeamMatch, type TeamMatchSide } from "./data";

type View = "list" | "calendar";
type Filter = "all" | "finished" | "upcoming";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthKey = (iso: string) => {
  const d = new Date(iso);
  return `${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[]; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-chip border border-hairline bg-bg/40 p-0.5">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.id)}
            className={`cursor-pointer rounded-[7px] px-3 py-1 text-label font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-up/50 ${
              on ? "bg-hairline/60 text-hi" : "text-lo hover:text-hi"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function selfLocal(t: TeamProfile, side: TeamMatchSide): string | null {
  return t.crest && t.tla && side.code === t.tla ? t.crest : null;
}

function Side({ t, side, win, right = false }: { t: TeamProfile; side: TeamMatchSide; win: boolean; right?: boolean }) {
  return (
    <span className={`flex min-w-0 items-center gap-1.5 ${right ? "flex-row-reverse" : ""}`}>
      <SideCrest code={side.code} size={16} localCrest={selfLocal(t, side)} name={side.name} />
      <span className={`num truncate text-caption tabular-nums ${win ? "font-semibold text-hi" : "text-lo"}`}>{side.code ?? side.name}</span>
    </span>
  );
}

function MatchRow({ t, m }: { t: TeamProfile; m: TeamMatch }) {
  const rt = resultToken(m.result);
  const homeWin = m.score?.winner === "HOME_TEAM";
  const awayWin = m.score?.winner === "AWAY_TEAM";
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-hairline px-3 py-2.5 last:border-0 transition-colors duration-150 hover:bg-hairline/10">
      <span className="num w-16 shrink-0 text-label tabular-nums text-lo">{m.score ? fmtDate(m.date).slice(0, 6) : fmtKickoff(m.date)}</span>
      <span className="grid min-w-0 grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Side t={t} side={m.home} win={homeWin} />
        <span className="num shrink-0 rounded bg-hairline/40 px-2 py-0.5 text-caption font-semibold tabular-nums text-hi">{m.score ? `${m.score.h}–${m.score.a}` : "v"}</span>
        <Side t={t} side={m.away} win={awayWin} right />
      </span>
      <span className={`num inline-grid h-6 w-6 shrink-0 place-items-center rounded-chip text-label font-semibold tabular-nums ring-1 ring-inset ring-hairline ${m.score ? rt.cls : "text-lo"}`}>{m.score ? rt.label : "·"}</span>
    </div>
  );
}

function CalendarCell({ t, m }: { t: TeamProfile; m: TeamMatch }) {
  const rt = resultToken(m.result);
  const opp = m.side === "home" ? m.away : m.home;
  const d = new Date(m.date);
  return (
    <div className="flex min-w-[104px] flex-col gap-1 rounded-card border border-hairline bg-surface px-3 py-2">
      <span className="num text-label tabular-nums text-lo">{`${d.getUTCDate()} ${MON[d.getUTCMonth()]}`}</span>
      <span className="flex items-center gap-1.5">
        <SideCrest code={opp.code} size={16} name={opp.name} />
        <span className="num truncate text-caption tabular-nums text-hi">{opp.code ?? opp.name}</span>
      </span>
      <span className={`num text-label tabular-nums ${m.score ? rt.cls : "text-lo"}`}>{m.score ? `${m.score.h}–${m.score.a} ${rt.label}` : fmtKickoff(m.date).split(" · ")[1]}</span>
    </div>
  );
}

/** The left-panel Matches list — List/Calendar toggle, Finished/Upcoming filter, grouped by competition, each row a
 *  W/D/L pill (--up / --text-lo / --down). Pure client toggles over the server-passed, already-baked matches. */
export function MatchesPanel({ t }: { t: TeamProfile }) {
  const [view, setView] = useState<View>("list");
  const [filter, setFilter] = useState<Filter>("all");

  const matches = useMemo(() => t.matches.filter((m) => (filter === "finished" ? isFinished(m) : filter === "upcoming" ? !isFinished(m) : true)), [t.matches, filter]);
  const groups = useMemo(() => byCompetition(matches), [matches]);

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-strong font-semibold text-hi">Matches</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented value={filter} onChange={setFilter} label="Match filter" options={[{ id: "all", label: "All" }, { id: "finished", label: "Finished" }, { id: "upcoming", label: "Upcoming" }]} />
          <Segmented value={view} onChange={setView} label="Match view" options={[{ id: "list", label: "List" }, { id: "calendar", label: "Calendar" }]} />
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-card border border-dashed border-hairline p-6 text-center text-caption text-lo">
          No {filter === "all" ? "" : `${filter} `}matches for {t.shortName ?? t.name}.
        </div>
      ) : view === "list" ? (
        <div className="flex flex-col gap-4">
          {groups.map((g) => (
            <div key={g.competition} className="overflow-hidden rounded-card border border-hairline">
              <div className="border-b border-hairline bg-bg/30 px-3 py-2 text-label uppercase tracking-micro text-lo">{g.competition}</div>
              {g.matches.map((m) => (
                <MatchRow key={m.id} t={t} m={m} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Array.from(new Set(matches.map((m) => monthKey(m.date)))).map((mk) => (
            <div key={mk}>
              <div className="mb-2 text-label uppercase tracking-micro text-lo">{mk}</div>
              <div className="flex flex-wrap gap-2">
                {matches.filter((m) => monthKey(m.date) === mk).map((m) => (
                  <CalendarCell key={m.id} t={t} m={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
