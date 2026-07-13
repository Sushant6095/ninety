# ADR 053 WebGL / 3D allowed in the app — @shadergradient/react + @react-three/fiber + three sanctioned for ambient/hero visuals (reverses the ui-craft §7 "3D is FORBIDDEN" ban)

Status: accepted 2026-07-13. Supersedes: the `ui-craft` §7 clause "Spline / WebGL / any 3D is FORBIDDEN in the app." Reverses it for the R3F/three/shadergradient stack (Spline stays out).

Context: `ui-craft` §7 banned all WebGL/3D on the grounds that GPU contention breaks the 150ms tick-to-pixel path and reads as demo-ware — the same reason MotionScore just graded our GPU pressure at B-tier (244 MB texture @2x). The repo owner elected to add a 3D visual stack for ambient/hero surfaces. Per the standing "prompts are law" rule, the ban is reversed with discipline rather than argued.

Decision:
- **WebGL / 3D is allowed.** Installed in `apps/web`: `@shadergradient/react`, `@react-three/fiber@9` (React 19–compatible), `three@0.185`, `three-stdlib`, `camera-controls`, `@types/three` (dev).
- **Where it belongs:** ambient/hero visuals only — shader-gradient backdrops, the North Star surface, hero scenes. NOT the live trading surfaces.
- **Discipline (hold it, it's not a free-for-all):** lazy-load via `next/dynamic` with `ssr:false`; keep 3D OFF the live trading hot path so the Momentum River + price tape stay jank-free; pause/teardown the render loop under `prefers-reduced-motion` and when offscreen; watch the GPU-layer/texture budget (re-run MotionScore after adding a scene — we're already at B on GPU pressure). Spline remains banned (proprietary + heavy).
- **Law files amended:** `ui-craft` §7 (WebGL ALLOWED + discipline), `design-cop` criterion 5 (the "no idle/infinite animation" rule now carves out sanctioned ambient WebGL backdrops, which must be lazy-loaded, off the hot path, and paused under reduced-motion/offscreen).
- **Also registered (separate):** a local `motion-dev` MCP server (`node ~/motion-dev-mcp/dist/index.js`) — currently ✘ failed to connect because that file does not exist yet; it will connect once the `~/motion-dev-mcp` project is built.

Consequences: 3D visuals are now on the table for ambient/hero work, and design-cop won't auto-fail shader gradients for idle animation. Risk — GPU pressure worsens (already B) and the hot trading path could jank if 3D leaks onto it; bounded by the lazy-load + off-hot-path + reduced-motion + re-audit discipline. VERIFY: `pnpm --filter web build` green with the deps installed; `ui-craft` §7 + `design-cop` crit 5 updated. Cross-ref: ADR-052 (GSAP — the other animation reversal), the MotionScore audit (GPU pressure B-tier, the reason for the discipline), ui-craft §3 (River-as-hero — must stay jank-free), ADR-049 (design-cop criteria).
