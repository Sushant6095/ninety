#!/usr/bin/env bash
INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
[ -z "$CMD" ] && exit 0
echo "$CMD" | grep -qE 'rm -rf (/|~|\.\.)' && { echo "BLOCKED: destructive rm." >&2; exit 2; }
echo "$CMD" | grep -qE 'git push .*(--force|-f).*(main|master)' && { echo "BLOCKED: force-push to main." >&2; exit 2; }
echo "$CMD" | grep -qiE 'drop table|prisma migrate reset' && { echo "BLOCKED: destructive DB op — ask the human." >&2; exit 2; }
echo "$CMD" | grep -qE '(cat|less|head|tail) .*\.env(\b|$)' && { echo "BLOCKED: .env contains secrets." >&2; exit 2; }
exit 0
