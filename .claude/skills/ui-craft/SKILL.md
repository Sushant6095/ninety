---
name: ui-craft
description: The ROUTER for all apps/web frontend work. NOT a craft skill — a thin dispatcher. It reads the task and tells you which PROVEN published skill to invoke. Use before any apps/web change. It has no design opinions of its own; the proven skills carry the craft, CLAUDE.md carries the constraints, this router connects them.
---

# ui-craft — the frontend ROUTER (dispatch only)

This skill has **no craft and no opinions.** Its whole job: read the task → point you at the right
**proven, published** skill → make sure the output obeys CLAUDE.md. That's it. Do not treat anything
below as design law — the design law is CLAUDE.md; the design *craft* is the proven skills.

## §0 — DISPATCH TABLE. Find your task. Invoke that PROVEN skill. One row, one skill.

### FIRST, classify the task — this is where mis-routes happen:
- **Adding / integrating / re-skinning a COMPONENT** (`shadcn add X`, a skiper / magicui / 21st pull,
  wiring a pre-built component that already ships its own motion) → this is COMPONENT WORK → **ui-ux-pro-max**.
  Do NOT route it to gsap/emil just because the component animates — it already ships its animation.
- **BUILDING motion from scratch** (a bespoke sequence, a scroll choreography you write yourself) →
  the motion skills below.

| Task | Invoke (proven skill) |
|---|---|
| Add / integrate / re-skin a component (`shadcn add …`, skiper, magicui, 21st pulls) | **ui-ux-pro-max** |
| Build / compose a screen or general frontend UI | **ui-ux-pro-max** |
| Landing / redesign / anti-slop taste | **design-taste-frontend** |
| BUILD a bespoke animation/motion from scratch | **emil-design-eng** |
| BUILD scroll choreography from scratch (ScrollTrigger, pins, draws) | **gsap-skills** (greensock) |
| Review existing motion, strict | **review-animations** (call it by name — won't self-fire) |
| Audit + plan ALL motion in the codebase | **improve-animations** |
| Find where motion helps — and where NOT | **find-animation-opportunities** |
| Name / describe an effect precisely | **animation-vocabulary** |
| Fluid, spring, gesture, Apple-style feel | **apple-design** |

Non-skill routes (a tool or an agent, not a skill):

| Task | Use |
|---|---|
| Pull a generic primitive (dialog, tabs, ticker, marquee, bento) | **TOOL** → shadcn → magicui → 21st.dev MCP, re-skin to tokens |
| A library API you haven't verified this session | **TOOL** → context7 (no API from memory) |
| Verify a screen | **AGENT** → design-cop (writes its verdict to `design/verdicts/`) |

## THE ONLY RULE THIS ROUTER ENFORCES
Whatever a proven skill produces, the **output must obey CLAUDE.md**:
- Tokens only, no raw hex · play-money copy (never bet / stake / odds / wager) · the Momentum River
  is the hero · motion honors `prefers-reduced-motion`.
The router = dispatch + enforce CLAUDE.md on the result. Nothing else.

## DO NOT invoke our custom / project skills
**momentum-river · proof-flow-viz · component-picker · dataviz** — these are ours, unproven, and they
mess things up. Never invoke them. The River and the proof-flow page are **hand-built to their specs**
(reference docs), not driven by a skill.

## Hand-build only these (no skill, no registry has them)
The Momentum River, MatchCard, PriceChip, the trade ticket, ProofBadge, the Booth. Everything else
generic comes from a tool; everything else crafted comes from a proven skill above.
