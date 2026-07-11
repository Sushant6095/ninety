#!/usr/bin/env bash
# Auto-resuming overnight run for Claude Code (headless).
# Retries through usage-limit resets until the queue is all-green or genuinely blocked.
# Resume is driven by the LOG + instruction ("skip GREEN"), not --resume: every attempt is a
# fresh `claude -p` session that reads the log first and continues from the first non-green prompt.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
ROOT="$(pwd)"

# ---- knobs (edit these) --------------------------------------------------
INSTRUCTION="$ROOT/.claude/prompts/_overnight-instruction.md"
LOG="$ROOT/.claude/context/overnight-log.md"
DONE_MARKER="OVERNIGHT COMPLETE"      # agent appends this when the whole queue is green
BLOCK_MARKER="OVERNIGHT BLOCKED"      # agent appends this on a genuine blocker (real stop, not a retry)
RETRY_SLEEP=3600                      # wait past chunks of the ~5h usage window, then retry
MAX_ATTEMPTS=48                       # backstop: ~48h ceiling so a broken run can't loop forever
# ponytail: no separate yolo.sh — the claude call is inlined right here.
# --dangerously-skip-permissions is required for a truly unattended run (nobody to answer prompts
# at 3am, and Write/Edit aren't in the settings allowlist). This is the one line that conflicts with
# the "no dangerous flag" rule — swap to `--permission-mode acceptEdits` if you'd rather it prompt.
PERM=(--dangerously-skip-permissions)
# Model: NOT set on purpose — "use my current model as-is; do not switch models."
# -------------------------------------------------------------------------

if [[ ! -f "$INSTRUCTION" ]]; then
  echo "missing instruction file: $INSTRUCTION" >&2
  exit 1
fi
mkdir -p "$(dirname "$LOG")"
touch "$LOG"

caffeinate -dis &   # keep the Mac awake
CAF=$!
trap 'kill "$CAF" 2>/dev/null' EXIT

ATTEMPT=1
while (( ATTEMPT <= MAX_ATTEMPTS )); do
  {
    echo ""
    echo "=== attempt $ATTEMPT at $(date) ==="
  } >> "$LOG"

  claude -p "$(cat "$INSTRUCTION")" \
    "${PERM[@]}" \
    --output-format text >> "$LOG" 2>&1
  CODE=$?
  echo "=== claude exited ($CODE) at $(date) ===" >> "$LOG"

  if grep -qF "$DONE_MARKER" "$LOG"; then
    echo "=== all prompts green, done ===" >> "$LOG"
    break
  fi
  if grep -qF "$BLOCK_MARKER" "$LOG"; then
    echo "=== genuine blocker recorded — stopping (see NOW.md) ===" >> "$LOG"
    break
  fi

  echo "=== paused (likely usage limit), sleeping ${RETRY_SLEEP}s before retry ===" >> "$LOG"
  sleep "$RETRY_SLEEP"
  ATTEMPT=$(( ATTEMPT + 1 ))
done

if (( ATTEMPT > MAX_ATTEMPTS )); then
  echo "=== hit MAX_ATTEMPTS ($MAX_ATTEMPTS) without completing — check the log ===" >> "$LOG"
fi
