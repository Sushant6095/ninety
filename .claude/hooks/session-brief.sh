#!/usr/bin/env bash
# SessionStart: inject live project state so every session begins oriented.
BRANCH=$(git branch --show-current 2>/dev/null || echo "no-git")
DAYS=$(( ( $(date -d 2026-07-19 +%s 2>/dev/null || date -j -f %Y-%m-%d 2026-07-19 +%s) - $(date +%s) ) / 86400 ))
NOW=$(grep -vE '^#|^\(' .claude/context/NOW.md 2>/dev/null | tr '\n' ' ' | cut -c1-400)
ADRS=$(ls docs/adr 2>/dev/null | tail -3 | tr '\n' ' ')
INBOX=$(wc -l < docs/adr/inbox.md 2>/dev/null || echo 0)
printf '{"additionalContext": "OMNIPITCH brief — branch: %s · days to deadline: %s · NOW: %s· latest ADRs: %s· inbox lines awaiting /adr: %s"}\n' "$BRANCH" "$DAYS" "$NOW" "$ADRS" "$INBOX"
exit 0
