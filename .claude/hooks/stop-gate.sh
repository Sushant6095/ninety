#!/usr/bin/env bash
# Stop gate: Claude may not declare "done" with red tests on critical paths.
INPUT=$(cat)
[ "$(echo "$INPUT" | jq -r '.stop_hook_active // false')" = "true" ] && exit 0   # prevent infinite loop
CHANGED=$(git diff --name-only HEAD 2>/dev/null | grep -E 'apps/api/src/engine/|programs/' || true)
if [ -n "$CHANGED" ]; then
  pnpm --filter @omnipitch/api test >/dev/null 2>&1 || { echo '{"decision":"block","reason":"engine/programs changed this session and tests are failing — fix tests before stopping."}'; exit 0; }
fi
echo "$(date -u +%FT%TZ) session-stop clean" >> .claude/trace/sessions.log 2>/dev/null || true
exit 0
