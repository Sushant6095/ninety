# ADR-008 ai native architecture
Status: accepted 2026-07-05. The repo enforces its own laws on AI contributors:
hooks (law-guard, bash-guard, related-tests loop, stop-gate, session-brief, precompact-save, trace) ·
six subagents (engine-guardian, proof-auditor, design-cop, quant-reviewer, test-fixer, adr-scribe) ·
six commands (/adr /ship /screen /spike-proof /replay /trace) · per-directory CLAUDE.md memory ·
PR review via claude-code-action · action trace in .claude/trace/. Requires: jq installed.
Decision protocol: every decision made in a session ends with /adr — chat is not memory, ADRs are.
