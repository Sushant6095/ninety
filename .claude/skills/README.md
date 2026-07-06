# .claude/skills — extension rail #1 (grows without limit)
Skills are auto-triggered procedure packs: Claude reads a SKILL.md whenever a task matches its description.
Add your own: copy `_TEMPLATE/`, rename, write name+description frontmatter (the description IS the trigger — be specific), add reference files beside it.
Add third-party: (a) drop any published skill folder in here, (b) install Claude Code plugins from a marketplace (`/plugin` — plugins bundle skills+commands+agents+MCP), (c) personal-only skills go in ~/.claude/skills.
House rule: a skill must encode procedure we repeat ≥3 times or constraints Claude keeps forgetting. One-off knowledge belongs in docs/, not here.
