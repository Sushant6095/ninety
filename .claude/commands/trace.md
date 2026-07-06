---
description: Summarize what AI sessions did today (the audit trail)
allowed-tools: Bash(jq:*), Bash(cat:*), Bash(tail:*)
---
Read .claude/trace/actions.jsonl (today's entries): summarize tool-call counts, files touched (grouped by layer folder), commands run, and any blocked actions mentioned in recent session logs. End with: decisions detected that are NOT yet in docs/adr (check inbox.md) — and offer /adr for each.
