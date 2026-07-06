#!/usr/bin/env bash
# Append-only trace of every AI action (tools used, files touched, commands run).
INPUT=$(cat)
mkdir -p .claude/trace
echo "$INPUT" | jq -c '{ts: now|floor, event: .hook_event_name, tool: .tool_name, file: (.tool_input.file_path // null), cmd: (.tool_input.command // null)}' >> .claude/trace/actions.jsonl 2>/dev/null || true
exit 0
