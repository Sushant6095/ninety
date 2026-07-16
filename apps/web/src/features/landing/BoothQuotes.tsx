import { BOOTH_GOAL, BOOTH_TIMELINE, type BoothEvent } from "../../lib/terminal";

// notio's testimonial slot, Ninety-ified: no invented customers — the quotes are the Booth's real
// commentary from the AUS–EGY demo market (same match LoopStage replays), each line tied to the
// move it made. Chronological, ending on the 74' goal call: the match story IS the social proof.
const QUOTES: readonly BoothEvent[] = [BOOTH_TIMELINE[3]!, BOOTH_TIMELINE[0]!, BOOTH_GOAL];

/** "From the booth" — 2–3 commentary lines as quote cards, sitting between the free-credits panel
 *  and the close. The goal card carries the up accent (it repriced the market); everything else
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
          Live commentary from the Australia–Egypt market — every line stamped with the move it made.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {QUOTES.map((q) => {
            const isGoal = Boolean(q.repriced);
            return (
              <figure
                data-arrive-item
                key={q.minute}
                className={`flex flex-col justify-between rounded-card bg-surface p-6 ring-1 ring-inset ${
                  isGoal ? "ring-up/40" : "ring-hairline"
                }`}
              >
                <blockquote>
                  <p className="num text-label font-semibold tracking-caps text-lo">{q.minute}&prime;</p>
                  <p className="mt-3 text-body leading-relaxed text-hi">&ldquo;{q.text}&rdquo;</p>
                </blockquote>
                <figcaption className="mt-5 flex items-center justify-between gap-3 border-t border-hairline/60 pt-4 text-label text-lo">
                  <span className="uppercase tracking-caps">The Booth &middot; AUS&ndash;EGY</span>
                  <span className="num font-medium text-up">
                    {q.repriced ?? `+${q.delta.toFixed(1)}`}
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
