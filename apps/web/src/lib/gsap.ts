"use client";
// Central GSAP setup for Ninety (ADR-052). GSAP is the sanctioned lib for HEAVY motion —
// the River stroke draw (DrawSVGPlugin), how-it-works scrollytelling (ScrollTrigger/ScrollSmoother),
// hero text (SplitText) — ALONGSIDE Framer Motion, which stays for micro-interactions.
//
// Import gsap + useGSAP from HERE so plugins are registered once and tweens inherit the motion
// tokens. Heavier plugins (DrawSVGPlugin, SplitText, ScrollSmoother) are free in gsap@3.13+ —
// import them directly (e.g. `import { DrawSVGPlugin } from "gsap/DrawSVGPlugin"`) in the one
// surface that needs them and register there, to keep the shared bundle lean.
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import motion from "../design/motion";

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);

// Mirror design/motion.ts easeOut cubic-bezier so GSAP matches Framer + CSS exactly (one motion law).
const [x1, y1, x2, y2] = motion.easeOut;
CustomEase.create("ninety", `M0,0 C${x1},${y1} ${x2},${y2} 1,1`);

// Token-aligned defaults: the standard 200ms transition + the shared ease. Override per-tween as needed.
// Reduced motion is honored per-use via useGSAP + gsap.matchMedia (see the gsap-core skill).
gsap.defaults({ duration: motion.transition / 1000, ease: "ninety" });

export { gsap, useGSAP, ScrollTrigger };
