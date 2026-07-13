# decision inbox — lines here await /adr
- 2026-07-08T07:55:50Z compaction occurred — if a decision was made this session and not yet ADR'd, capture it now (/adr).

## 2026-07-14 · SECURITY INCIDENT — settings.json invalid JSON, hooks + permission guards down
During the REBUILD Part 2.1 (fixing hook paths), `.claude/settings.json` became **invalid JSON**: the
`permissions.deny` block was dropped leaving a trailing comma after `allow`. Two overlapping exposure windows:
1. **Invalid-JSON window:** the file did not parse → **zero hooks loaded** (law-guard, bash-guard, trace,
   related-tests, stop-gate, session-brief, precompact-save all inert) AND no allow/deny rules applied.
2. **Missing-deny window:** after the file was rewritten to valid JSON it was still **without `deny`** until
   restored → the four guards `Read(./.env)`, `Read(./.keys/**)`, `Bash(git push --force)`, `Bash(rm -rf /)`
   were absent. `.env` was readable via the Read tool with no guard for this period.
- **Duration:** unknown / most of a working session (2026-07-13 → 07-14).
- **Known exploitation:** none observed — no Read was issued against `./.env` or `./.keys/**`, and no
  force-push / `rm -rf` ran during either window.
- **Remediation (done):** `deny` restored exactly; verified `settings.json` parses and all 7 hooks load.
- **ACTION REQUIRED (owner, cannot be done by the agent):** rotate **TXLINE_TOKEN** and the **OriginKit API
  key** as a precaution, since `.env` sat readable without the guard for a period.
- Needs an ADR: record the incident + the rule "validate settings.json parses and re-list hooks after any
  edit to it; never leave it unparseable."
