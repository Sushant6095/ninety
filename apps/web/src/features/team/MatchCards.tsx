import { SideCrest } from "./Crest";
import { fmtDate, fmtKickoff, stageLabel, resultToken, previousMatch, nextMatch, type TeamProfile, type TeamMatch, type TeamMatchSide } from "./data";

function selfCrest(t: TeamProfile, side: TeamMatchSide): string | null {
  return t.crest && t.tla && side.code === t.tla ? t.crest : null;
}

function TeamLine({ t, side, goals, win }: { t: TeamProfile; side: TeamMatchSide; goals: number | null; win: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-2">
        <SideCrest code={side.code} size={20} localCrest={selfCrest(t, side)} name={side.name} />
        <span className={`truncate text-caption ${win ? "font-semibold text-hi" : "text-lo"}`}>{side.name}</span>
      </span>
      {goals != null && <span className={`num text-caption tabular-nums ${win ? "font-semibold text-hi" : "text-lo"}`}>{goals}</span>}
    </div>
  );
}

function CardShell({ label, meta, children }: { label: string; meta: string | null; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-card border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-label uppercase tracking-micro text-lo">{label}</span>
        {meta && <span className="truncate text-label uppercase tracking-micro text-lo">{meta}</span>}
      </div>
      {children}
    </div>
  );
}

function PreviousCard({ t }: { t: TeamProfile }) {
  const m = previousMatch(t);
  if (!m || !m.score) {
    return (
      <CardShell label="Previous match" meta={null}>
        <span className="mt-3 text-caption text-lo">No completed matches yet.</span>
      </CardShell>
    );
  }
  const rt = resultToken(m.result);
  const homeWin = m.score.winner === "HOME_TEAM";
  const awayWin = m.score.winner === "AWAY_TEAM";
  return (
    <CardShell label="Previous match" meta={`${m.competition.name}${m.stage ? ` · ${stageLabel(m.stage)}` : ""}`}>
      <div className="mt-3 flex flex-col gap-2">
        <TeamLine t={t} side={m.home} goals={m.score.h} win={homeWin} />
        <TeamLine t={t} side={m.away} goals={m.score.a} win={awayWin} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-2">
        <span className="num text-label tabular-nums text-lo">{fmtDate(m.date)} · FT</span>
        <span className={`num rounded-chip px-2 py-0.5 text-label font-semibold ring-1 ring-inset ring-hairline ${rt.cls}`}>{rt.label}</span>
      </div>
    </CardShell>
  );
}

function NextCard({ t }: { t: TeamProfile }) {
  const m = nextMatch(t);
  if (!m) {
    // Honest empty state — a knocked-out nation has no next fixture; we never invent one.
    return (
      <CardShell label="Next match" meta={null}>
        <span className="mt-3 text-caption text-lo">
          {t.kind === "nation" ? "Tournament over for " : "No scheduled fixture for "}
          {t.shortName ?? t.name}.
        </span>
      </CardShell>
    );
  }
  return (
    <CardShell label="Next match" meta={`${m.competition.name}${m.stage ? ` · ${stageLabel(m.stage)}` : ""}`}>
      <div className="mt-3 flex flex-col gap-2">
        <TeamLine t={t} side={m.home} goals={null} win={false} />
        <TeamLine t={t} side={m.away} goals={null} win={false} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-hairline pt-2">
        <span className="num text-label tabular-nums text-lo">{fmtKickoff(m.date)}</span>
        <span className="text-label uppercase tracking-micro text-lo">Kickoff</span>
      </div>
    </CardShell>
  );
}

/** Previous + Next match — the right of the header, mirroring the reference's two cards. */
export function MatchCards({ t }: { t: TeamProfile }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <PreviousCard t={t} />
      <NextCard t={t} />
    </div>
  );
}
