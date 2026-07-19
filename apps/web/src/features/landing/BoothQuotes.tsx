// The Booth's own lines from the SAME featured market the hero + LoopStage show (CAN–MAR, wc26-can-mar) —
// so every surface on the page reads one match (read-out-loud). Illustrative demo commentary for the
// featured replay, not invented testimonials; each line is stamped with the move it made, ending on the
// 74' goal that repriced Canada to 61.4 (the number the price-is-probability section enlarges).
const QUOTES = [
  { minute: 9, text: "Canada start on the front foot. The market drifts their way before a real chance arrives.", value: "+3.1", goal: false },
  { minute: 63, text: "Morocco steady the game and the tape goes quiet. No move; the Booth calls it even for now.", value: "+0.6", goal: false },
  { minute: 74, text: "Canada strike! The market lurches: CAN to win jumps from 41 to 61.4 on the goal.", value: "61.4", goal: true },
] as const;

/** "From the booth" — three commentary lines as quote cards, sitting between the free-credits panel
 *  and the games bento. The goal card carries the up accent (it repriced the market); everything else
 *  stays quiet. Cards are not interactive — no hover states by design. */
export function BoothQuotes() {
  return (
    <section aria-labelledby="booth-h" className="border-b border-hairline">
      <div data-arrive className="mx-auto w-full max-w-[1180px] px-4 py-16 sm:px-6 lg:py-20">
        <p data-arrive-item className="text-label font-semibold uppercase tracking-caps text-lo">
          From the booth
        </p>
        {/* deliberate callback to the hero's promise line — here it is being kept, live */}
        <h2 data-arrive-item id="booth-h" className="mt-4 max-w-[20ch] font-display text-section font-bold text-hi">
          The Booth explains every swing.
        </h2>
        <p data-arrive-item className="mt-4 max-w-[52ch] text-strong leading-relaxed text-lo">
          Live commentary from the Canada–Morocco market, every line stamped with the move it made.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {QUOTES.map((q) => (
            <figure
              data-arrive-item
              key={q.minute}
              className={`flex flex-col justify-between rounded-card bg-surface p-6 ring-1 ring-inset ${
                q.goal ? "ring-up/40" : "ring-hairline"
              }`}
            >
              <blockquote>
                <p className="num text-label font-semibold tracking-caps text-lo">{q.minute}&prime;</p>
                <p className="mt-3 text-body leading-relaxed text-hi">&ldquo;{q.text}&rdquo;</p>
              </blockquote>
              <figcaption className="mt-5 flex items-center justify-between gap-3 border-t border-hairline/60 pt-4 text-label text-lo">
                <span className="uppercase tracking-caps">The Booth &middot; CAN&ndash;MAR</span>
                <span className="num font-medium text-up">{q.value}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
