"use client";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { motion as m } from "../../design/motion";

/** framer-motion scroll-reveal — sections fade + rise once as they enter the viewport. Respects reduced motion
 *  (renders inert). Durations/easing come from the Ninety motion token (design law). */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: m.slow / 1000, ease: m.easeOut }}
    >
      {children}
    </motion.div>
  );
}
