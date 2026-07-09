"use client";
import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { motion as m } from "../../design/motion";

/** framer-motion scroll-reveal — sections fade + rise once as they enter the viewport. Durations/easing come
 *  from the Ninety motion token (design law). The server and first client render are an identical plain <div>
 *  (mounted=false) so there is no hydration mismatch; motion attaches only after mount, and reduced-motion
 *  users keep the plain <div>. All Reveal'd sections are below the fold, so there is no first-paint flash. */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotion();
  useEffect(() => setMounted(true), []);

  if (!mounted || reduce) return <div className={className}>{children}</div>;
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
