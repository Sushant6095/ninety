Resume the overnight prompt queue, IN ORDER.

FIRST read `.claude/context/overnight-log.md` and `.claude/context/NOW.md`.
Skip every prompt already marked GREEN in the log; continue from the first that isn't.

QUEUE: run the prompt files in `.claude/prompts/<your-queue-dir>/` in filename order.
(Point this at your real queue before the first run — e.g. the folder holding the prompts
you want ground through overnight.)

Rules:
- One prompt fully VERIFY-green before starting the next. No skipping ahead.
- `/ship` each prompt when green (commit only — NEVER push).
- After each green prompt, append one line to the log:
  `PROMPT <NN> GREEN — <commit-sha> — <one line of what shipped>`
- Use my current model as-is; do NOT switch models.

Stopping:
- When the LAST prompt in the queue is green, append `OVERNIGHT COMPLETE` to the log and stop.
- If genuinely blocked (missing env, red foundation, external dependency down), record the blocker
  to `NOW.md`, append `OVERNIGHT BLOCKED — <one line reason>` to the log, and stop. That is a real
  stop — do not thrash around it.
- If the usage limit pauses you mid-work, just stop. The wrapper retries after the reset, and the
  log tells the next attempt where to pick up.
