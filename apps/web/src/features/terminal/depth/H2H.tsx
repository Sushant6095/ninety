import { Flag } from "../../../components/ui/Flag";
import { H2H as MEETINGS, FORM } from "../../../lib/matchdepth";

const FORM_TONE = { W: "bg-up/20 text-up ring-up/40", D: "bg-hairline/60 text-lo ring-hairline", L: "bg-down/20 text-down ring-down/40" } as const;

function FormRow({ code, form }: { code: string; form: ("W" | "D" | "L")[] }) {
  return (
    <div className="flex items-center gap-2">
      <Flag code={code} size={18} />
      <span className="w-9 text-caption font-medium text-hi">{code}</span>
      <span className="flex gap-1">
        {form.map((f, i) => (
          <span key={i} className={`num grid h-5 w-5 place-items-center rounded text-label font-bold ring-1 ring-inset ${FORM_TONE[f]}`}>{f}</span>
        ))}
      </span>
    </div>
  );
}

export function H2H() {
  return (
    <div className="p-4">
      <div className="rounded-card border border-hairline bg-surface p-4">
        <h3 className="text-label font-semibold uppercase tracking-[0.12em] text-lo">Recent form</h3>
        <div className="mt-3 flex flex-col gap-2">
          <FormRow code="AUS" form={FORM.home} />
          <FormRow code="EGY" form={FORM.away} />
        </div>
      </div>

      <h3 className="mt-4 px-1 text-label font-semibold uppercase tracking-[0.12em] text-lo">Head to head</h3>
      <ul className="mt-2 overflow-hidden rounded-card border border-hairline bg-surface divide-y divide-hairline/60">
        {MEETINGS.map((m, i) => (
          <li key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2.5">
            <span className="flex min-w-0 items-center justify-end gap-2">
              <span className={`truncate text-caption font-medium ${m.win === "H" ? "text-hi" : "text-lo"}`}>{m.home}</span>
              <Flag code={m.home} size={16} />
            </span>
            <span className="num rounded bg-bg px-2 py-0.5 text-caption font-semibold tabular-nums text-hi ring-1 ring-inset ring-hairline">{m.score}</span>
            <span className="flex min-w-0 items-center gap-2">
              <Flag code={m.away} size={16} />
              <span className={`truncate text-caption font-medium ${m.win === "A" ? "text-hi" : "text-lo"}`}>{m.away}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
