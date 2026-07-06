#!/usr/bin/env bash
# THE LOOP: after any engine edit, tests run; on failure Claude receives the errors and fixes them.
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [[ "$FILE" == *apps/api/src/engine/* ]]; then
  OUT=$(pnpm --filter @omnipitch/api test 2>&1)
  if [ $? -ne 0 ]; then
    echo "engine tests FAILED after your edit — fix before continuing:" >&2
    echo "$OUT" | tail -30 >&2
    exit 2
  fi
fi
exit 0
