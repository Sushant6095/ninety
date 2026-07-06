---
description: Full feature workflow — explore, plan, build, review, ship
---
Feature: $ARGUMENTS
1. EXPLORE: read the relevant feature folder, packages/schema types, and matching docs — no code yet.
2. PLAN: enter plan mode; list files to touch, invariants at risk, and which review agent applies (engine-guardian / proof-auditor / design-cop / quant-reviewer).
3. BUILD: implement smallest-working-slice first; hooks will run tests on engine edits.
4. REVIEW: delegate to the matching review agent; fix its numbered findings.
5. REMEMBER: if any decision was made, /adr it now.
6. SHIP: run /ship with a summary. Update .claude/context/NOW.md if focus changed.
