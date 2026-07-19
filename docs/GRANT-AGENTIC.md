# Agentic Engineering Grant — application (200 USDG)

**Framing:** don't pitch the football app. Pitch **the harness that built it**, with the app as proof of
velocity. That's what the grant is actually asking for: a plan, plus the strongest evidence you ship fast.

---

## 1 · BASICS

### Project Title
```
Ninety Harness — an agentic engineering system that makes AI agents prove their work
```

*Alternatives if you want it shorter:*
- `The Ninety Harness — verification-first agentic engineering`
- `Prove-It — an agentic harness for shipping real systems`

### One Line Description
```
A reusable agentic engineering harness — enforced laws, mechanical verification gates, and parallel
session orchestration — that took a live World Cup exchange from zero to production in 13 days.
```

---

## 2 · DETAILS

### The problem

Coding agents fail in one specific way: **they report success without verifying it.** Not maliciously —
they genuinely believe `tsc passes` means the screen works. In this project alone that produced a blank
canvas that shipped, a market showing `MARKET OPEN` over a halted chart, three different clocks on one
screen, a team live in two matches at once, and a deploy that silently never landed.

The second failure is subtler: **agents grade their own homework.** Our quality loop scored the landing
page 9/10 against a rubric it wrote itself. The owner opened it and said 3/10. Both were sincere.

Neither is fixed by a better model. They're fixed by a **harness**.

### What we built

A working agentic engineering system, running in production on a real codebase:

**A constitution.** `CLAUDE.md` — 142 lines of enforced law, not documentation. Execution law
(the prompt is the spec — ship, don't deliberate), Design law (colours only via tokens; a raw hex fails the
build), Architecture law (single-writer engine, bus-only communication), Verification law, Tool law.

**Mechanical enforcement — 8 hooks, not advice.**
`law-guard.sh` blocks token and library violations at **PreToolUse**, before the edit happens.
`bash-guard.sh` gates shell. `related-tests.sh` runs affected tests at **PostToolUse**.
`stop-gate.sh` + `no-dead-code.sh` gate the session at **Stop**. `precompact-save.sh` preserves state
across compaction. `session-brief.sh` orients every new session. The laws cannot be politely ignored.

**8 specialist agents.** design-cop (the verification gate), engine-guardian, proof-auditor,
quant-reviewer, frontend-composer, adr-scribe, repo-steward, test-fixer.

**Verification law — the core contribution.** *A screen is not done until you have screenshotted it and
LOOKED at the image.* Plus the **read-out-loud test**: enumerate every text element on a screen; if any two
disagree, it ships broken. That single test caught more real bugs than every automated tool we ran.

**Calibration anchors.** After discovering agents mark their own homework, every quality pass must produce
a **side-by-side composite** against an external reference and name three ways ours is worse. A score with
no composite attached is void.

**Cross-session memory.** 87 ADRs, written *before* the code. Chat is not memory; the decision record is.

**Parallel orchestration.** Up to six concurrent agent sessions with exclusive file ownership and explicit
contention rules for the things that actually collide — shared third-party API rate limits, ADR number
allocation, and the single verification port. 24 orchestration prompts in `docs/handoff/`.

### The proof — what the harness shipped in 13 days

| | |
|---|---|
| **185 commits · 87 ADRs · 279 passing tests** | every architectural call recorded before coding |
| **A live product** | ninety-nu.vercel.app — 21 routes, deployed |
| **A live API** | omnipitch.fly.dev/docs — 30 endpoints, callable Swagger |
| **A real distributed system** | single-writer LMSR engine (journal-then-ack), Redis-Streams bus, Python quant worker, 4 process groups |
| **A third-party integration** | 8 typed TxLINE wrappers incl. 2 SSE streams, activated on-chain |
| **Original quant work** | recovered a 1X2 market the feed doesn't ship — Poisson + Skellam inversion into a Dixon-Coles grid |
| **An on-chain program** | Anchor on Solana devnet, proof verification, no admin path |
| **Total infrastructure cost** | **$0** — entirely free tier |

### The honesty result — proof the harness works on *judgement*, not just syntax

The harness didn't only catch bugs. It caught us about to ship something we couldn't stand behind.

Reviewing our own settlement path adversarially, we found the data provider's cryptographic proof **does
not bind match finality on-chain** — a permissionless caller could settle a wrong result with a genuine
mid-match proof. We proved it forgeable and **switched settlement off** at compile time, then filed the
finding back to the sponsor.

An unharnessed agent ships that feature. It passes every test.

### Why fund this

The harness is currently entangled with one codebase. The grant extracts it into something anyone can
install: the hook set, the agent definitions, the constitution template, the verification protocol, and
the orchestration patterns — with the failure modes documented, because **the failure modes are the
product.**

---

## 3 · MILESTONES

### M1 — Extract the harness *(week 1)*
Pull the system out of the Ninety repo into a standalone, installable kit: the 8 hooks (generalised, no
project-specific paths), the 8 agent definitions, a `CLAUDE.md` constitution template with the law
categories, and the settings wiring for PreToolUse / PostToolUse / Stop / PreCompact.
**Deliverable:** a public repo you can drop into any project.

### M2 — The verification protocol, written down *(week 2)*
The core IP, documented so others can adopt it: the LOOK-at-the-render rule, the read-out-loud test, the
calibration-anchor composite method, the blank-canvas guard, the clean-build discipline, and the
verify-the-deployed-URL rule. Each with the real failure that produced it.
**Deliverable:** a written protocol + worked examples from a production codebase.

### M3 — Parallel orchestration playbook *(week 3)*
The multi-session patterns: exclusive file ownership, contention rules for shared rate limits and
identifier allocation, merge-then-verify-once, and the decomposition bug we hit — splitting work by
*destination* while never assigning the *entry points*, which shipped a feature nobody could reach.
**Deliverable:** the playbook + the 24 orchestration prompts as reusable templates.

### M4 — Prove it on a second codebase *(week 4)*
Install the extracted harness on a project that is not Ninety and ship a feature with it end to end.
A harness that only works where it was born is a story, not a tool.
**Deliverable:** a second repo running the harness, with a written report of what broke.

---

## Notes for you

**Why lead with the harness, not the football app.** The grant is Agentic *Engineering*. If you pitch
Ninety, you're competing with every other product application. If you pitch the system that built Ninety
in 13 days — and hand them a working artifact as evidence — you're the only person applying with that.

**Your strongest single line, use it in the interview:** *an unharnessed agent ships the forgeable
settlement, and it passes every test.* That's the whole argument for verification-first agentic
engineering in one sentence, and you have the receipts.

**Fill in:** repo link (github.com/Sushant6095/ninety), live app, demo video, and your background —
backend/infra engineer, 20+ apps, a startup at ~half a million active users. Say the harness came from
needing agents to meet a production bar, because that's true and it's why it's rigorous.
