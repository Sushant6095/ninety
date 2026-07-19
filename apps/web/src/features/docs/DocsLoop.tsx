// The five-beat loop, the same visual the landing uses (LoopLegend) — but static: a reading page needs
// no live store. Goal → Halt → Reprice → The Booth → Settle; the Halt beat carries the amber --halt accent.
const STEPS: readonly { label: string; halt?: boolean }[] = [
  { label: "Goal" },
  { label: "Halt", halt: true },
  { label: "Reprice" },
  { label: "The Booth" },
  { label: "Settle" },
];

export function DocsLoop() {
  return (
    <ol className="mt-6 flex flex-wrap items-center gap-x-1 gap-y-2" aria-label="The market loop: Goal, Halt, Reprice, The Booth, Settle">
      {STEPS.map((s, i) => (
        <li key={s.label} className="flex items-center gap-x-1">
          <span
            className={`num rounded-md px-2.5 py-1.5 text-caption font-semibold uppercase tracking-caps ring-1 ring-inset ${
              s.halt ? "bg-halt/10 text-halt ring-halt/50" : "bg-surface text-hi ring-hairline"
            }`}
          >
            {s.label}
          </span>
          {i < STEPS.length - 1 && <span aria-hidden className="px-1 text-caption text-lo">→</span>}
        </li>
      ))}
    </ol>
  );
}
