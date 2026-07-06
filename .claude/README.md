# .claude/ — the AI-native layer
Install: unzip at repo root · `chmod +x .claude/hooks/*.sh` · ensure `jq` is installed · add ANTHROPIC_API_KEY secret for the PR reviewer.
What runs when: SessionStart briefs the model (branch, deadline countdown, latest ADRs) → PreToolUse guards block law violations (exit 2) → PostToolUse traces every action and runs engine tests (failures loop back to Claude) → Stop refuses "done" with red tests on engine/programs → PreCompact saves a decision-capture reminder. `/trace` reads the audit log; `/adr` makes forgetting impossible.
Personal overrides go in .claude/settings.local.json (gitignored) — never weaken guards in the shared file.

## Third-party extension rails (scope for growth)
1. Skills → drop folders in .claude/skills (see its README).
2. MCP servers → `claude mcp add <name> …` or edit .mcp.json; candidates when needed: GitHub MCP (issues/PRs), a Solana/Helius MCP (chain queries), Playwright MCP (E2E on the 20 screens), a docs MCP for library references.
3. Plugins → `/plugin` marketplaces bundle skills+commands+agents+hooks+MCP in one install.
4. More agents/commands → add .md files; description quality = delegation quality.
