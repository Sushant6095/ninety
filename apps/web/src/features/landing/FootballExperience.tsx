import { Tv, Activity, Target, Sparkles, Send } from "lucide-react";

// Section 5 — THE FOOTBALL EXPERIENCE (the Consumer-track pitch): the fan's journey through Ninety,
// told as five plain steps. Pure content + tokens; the scroll-arrival cascade comes from the parent
// LandingScroll ([data-arrive] / [data-arrive-item]). No live game mounts here (that lives on the
// terminal) — these are teasers that keep the landing's MotionScore clean.
const STEPS = [
  {
    n: "01",
    icon: Tv,
    title: "Watch the match",
    copy: "Live scores, the tape, and the Booth calling the game — every minute, in one calm terminal.",
  },
  {
    n: "02",
    icon: Activity,
    title: "Read the River",
    copy: "The market's momentum drawn as one line. Green and climbing means the price is running with the play.",
  },
  {
    n: "03",
    icon: Target,
    title: "Call the next goal",
    copy: "Tap Next Goal — a free, sixty-second read on who scores next. No credits at risk, just the call.",
  },
  {
    n: "04",
    icon: Sparkles,
    title: "Own the Moment",
    copy: "The match's biggest swings mint as Moments — the goal that moved the price, yours to keep.",
  },
  {
    n: "05",
    icon: Send,
    title: "Follow in Telegram",
    copy: "Match cards land in your chat: the price, the swing, and the Booth's one-line call as it happens.",
  },
] as const;

export function FootballExperience() {
  return (
    <section aria-labelledby="experience-h" className="border-b border-hairline">
      <div
        data-arrive
        className="mx-auto w-full max-w-[1180px] px-4 py-16 sm:px-6 lg:py-24"
      >
        <p data-arrive-item className="text-label font-semibold uppercase tracking-caps text-lo">
          The football experience
        </p>
        <h2
          data-arrive-item
          id="experience-h"
          className="mt-4 max-w-[20ch] font-display text-section font-bold text-hi"
        >
          This isn&apos;t a stats page. It&apos;s the match, priced live.
        </h2>
        <p data-arrive-item className="mt-5 max-w-[54ch] text-strong leading-relaxed text-lo">
          A fan opens Ninety the way they open a match — and every beat of the game is something to
          read, call, and keep. Here&apos;s the whole loop, end to end.
        </p>

        <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s) => (
            <li
              key={s.n}
              data-arrive-item
              className="elev group flex h-full flex-col gap-4 rounded-card border border-hairline/70 bg-surface p-5 transition-colors duration-200 hover:border-hairline"
            >
              <div className="flex items-center justify-between">
                <span className="num text-label font-semibold tracking-caps text-lo">{s.n}</span>
                <s.icon
                  className="h-5 w-5 text-up transition-transform duration-200 group-hover:-translate-y-0.5"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>
              <div>
                <h3 className="text-strong font-semibold text-hi">{s.title}</h3>
                <p className="mt-2 text-body leading-relaxed text-lo">{s.copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
