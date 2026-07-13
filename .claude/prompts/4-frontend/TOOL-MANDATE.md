# PROMPT — TOOL MANDATE: third-party components and motion are now COMPULSORY

Web/desktop only (lg + xl). Read this whole file before touching a single component.

## WHY THIS EXISTS
You have repeatedly been told to use shadcn / 21st.dev / component-picker / frontend-composer, and you
have repeatedly hand-rolled instead. Your own audit admitted: "I added zero new components from any
registry." That is not going to happen again. Three things caused it, and all three get fixed here:

1. **No gate.** design-cop scores the OUTPUT, so hand-rolled code passes and skipping the registry costs
   nothing. Instructions without enforcement get dropped. → Part 1 makes tool use a GATE.
2. **The law forbade the tools.** ui-craft says "Framer Motion is the ONLY animation lib" and design-cop
   criterion 9 FAILS any deviation from `design/screens/home.png`. A registry component trips both on
   arrival. → Part 2 amends the law.
3. **784 skills are installed.** Skill selection is description-matching; with ~12 skills all claiming to
   own "frontend design," the signal is gone and you pick none. → Part 3 prunes.

Do Parts 1–3 BEFORE any UI work. If you skip to Part 5 you will fail again exactly as before.

---

## PART 0 — PRECONDITIONS (human runs these; verify they exist before proceeding)
- OriginKit MCP: `claude mcp add originkit https://mcp.originkit.dev/mcp --transport http --header "Authorization: Bearer $ORIGINKIT_KEY" --scope user`
- GSAP: `npm install gsap` in `apps/web`
- Motion MCP: installed per motion.dev, `MOTION_TOKEN` set
- **NEVER put a literal API key in `.mcp.json` or any committed file. The repo is PUBLIC.** Env vars only.

First action: **verify each MCP responds.** List the tools each exposes. If one is not connected, STOP and
report — do not silently proceed and hand-roll.

---

## PART 1 — THE GATE (this is the part that actually changes behaviour)

Add a **PROVENANCE LOG**. Every UI task now produces `design/PROVENANCE.md`, appended per component:

```
| Component | Source | Tool call | Re-skinned | Screenshot |
|---|---|---|---|---|
| BracketTree | OriginKit | mcp__originkit__<tool> | tokens ✓ | impl/bracket.lg.png |
| GroupTable  | shadcn Table | search_items_in_registries → add | tokens ✓ | impl/competition.lg.png |
```

Rules, enforced:
- **A component with no row in PROVENANCE.md is NOT DONE.** Not "done but undocumented" — NOT DONE.
- `Source: hand-rolled` is only permitted for the six Ninety-specific pieces: MomentumRiver, MatchCard,
  PriceChip, trade ticket, ProofBadge, Booth. Everything else — tables, tabs, dialogs, sheets, tooltips,
  hovercards, scroll areas, command palette, accordions, badges, avatars, skeletons, toasts, brackets,
  pitch layouts, empty states — MUST come from a registry.
- Hand-rolling a generic primitive is a **DEFECT**, not a shortcut. Log it as a defect if you do it.

Add **design-cop criterion 12 — PROVENANCE**: every non-Ninety-specific component in the diff has a
PROVENANCE.md row naming the registry and the tool call. Missing → FAIL. design-cop reads the file.

---

## PART 2 — AMEND THE LAW (or the tools stay illegal)

Write **ADR-049** and amend `CLAUDE.md` + `.claude/skills/ui-craft/SKILL.md`:

1. **Animation:** the law currently reads "Framer Motion is the ONLY animation lib." Note that
   **Motion (motion.dev) IS Framer Motion rebranded** — same library, already legal. GSAP is a genuine
   SECOND animation library. Decide explicitly and record it:
   - Preferred split if you adopt GSAP: **Motion for UI/component state** (enter/exit, layout, tick-flash,
     `prefers-reduced-motion`) · **GSAP + ScrollTrigger for timeline-choreographed sequences** (the halt
     money-shot, the goal celebration, the Moment replay). Two libs, two clearly-bounded jobs, no overlap.
   - If you do NOT record this in an ADR, `law-guard` and design-cop will correctly reject every GSAP
     import and you will be right back where you started.
2. **Components:** registry-first is the DEFAULT. Hand-building a generic primitive is a defect.
   The token law applies to the OUTPUT of re-skinning, NOT to the moment of import. Pasting stock
   zinc/shadcn defaults is still a FAIL — re-skinning is the work.
3. **design-cop criterion 9:** replace `FIDELITY — matches the reference crop, drift → FAIL` with
   `CONSISTENCY — one shell, one scale across every page` + `ELEVATION — merely matching the reference is
   NOT passing`. Supersede ADR-043 (do not edit it). The reference is INTENT, not a ceiling.

What stays absolutely fixed and is NOT up for amendment: the tokens · play-money copy law (never
bet/stake/odds/wager) · the architecture law · River-as-hero · lightweight-charts as the only chart lib
(recharts stays banned — rip it out of `features/terminal/PortfolioCard.tsx` and `AttackMomentum.tsx`).

---

## PART 3 — PRUNE (10 minutes, unblocks everything)

784 skills are installed at user scope. At least twelve claim to own frontend design (`design-taste`,
`frontend-design`, `frontend-design-guidelines`, `ui-ux-pro-max`, `high-end-visual-design`, `apple-design`,
`page-load-animations`, plus ours). You cannot select correctly from that, so you select nothing.

`mv` everything except this working set out of `~/.claude/skills/` into `~/.claude/skills-disabled/`:
- `ui-craft`, `component-picker`, `momentum-river`, `txline-integration`, `anchor-settlement` (ours)
- **exactly ONE** taste skill — read the candidates, pick the best, disable the rest
- `dataviz`, `page-load-animations` (one animation skill, not three)

Report which you kept and why. Do not delete anything.

---

## PART 4 — THE MANDATORY PROTOCOL (per component, every component)

1. **Search the registries FIRST.** OriginKit → shadcn (`search_items_in_registries`) → 21st.dev. In that
   order. Log what you searched and what came back, even when nothing matches.
2. **Pull it in.** Log the tool call in PROVENANCE.md.
3. **Re-skin to Ninety tokens.** Zero raw hex, zero stock zinc. This is the craft — the import is not.
4. **Animate** per the ADR-049 split (Motion for state, GSAP for choreographed sequences).
5. **Screenshot lg+xl → VIEW → design-cop (criteria 1–12) → fix → repeat** until PASS.
6. Delegate to **frontend-composer** for component work — its own description says it MUST be used instead
   of hand-rolling primitives. Use **dataviz** BEFORE writing any chart. Use **context7** for live library
   APIs (GSAP, Motion, lightweight-charts) instead of guessing.

If you finish a component without a PROVENANCE row, you did it wrong. Go back.

---

## PART 5 — THE WORK (in this order)

1. **/bracket** — real 104-match WC26 structure. OriginKit/21st.dev for the bracket layout, shadcn
   ScrollArea + HoverCard for the chrome. GSAP timeline to reveal rounds R32 → Final.
2. **/competition** — 12 group tables with standings. shadcn Table + Tabs, re-skinned.
3. **The halt money-shot** — goal → River flash → amber HALT sweep → prices freeze → new price lands →
   spread decays over 60s. GSAP timeline. This is the best 8 seconds of the demo video. Record it.
4. **Crests + stadiums everywhere** — kill the 20px flag circles.
5. **Lineups pitch** (native SVG, no iframes) · **Command palette** (⌘K is advertised and likely dead).

## GUARDRAILS
Tokens only in the output. Play-money vocabulary always. No gradients, no glassmorphism, no light mode.
No third-party iframes in the product. `prefers-reduced-motion` honoured on every animation, GSAP included.
Don't touch `apps/api`, `packages/`, or `programs/`.

End with /adr.
