---
description: Lint, test, build, then commit with a conventional message
allowed-tools: Bash(pnpm:*), Bash(git:*)
---
1. Run `pnpm lint && pnpm test && pnpm build`. If anything fails, stop and fix (use test-fixer if needed).
2. Show `git diff --stat`.
3. Commit staged+unstaged work with a conventional-commit message summarizing the change: $ARGUMENTS
4. Do NOT push — the human pushes.
