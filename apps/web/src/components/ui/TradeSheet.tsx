"use client";
import type { ReactNode } from "react";
import { Dialog } from "radix-ui";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { motion as m } from "../../design/motion";

/** Mobile bottom-sheet — radix Dialog (focus trap, escape, aria) re-skinned to Ninety tokens, slid in with
 *  Framer Motion (the only animation lib). Controlled; renders its trade content as children. No glass/blur. */
export function TradeSheet({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-bg/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: m.fast / 1000 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                className="fixed inset-x-0 bottom-0 z-50 rounded-t-card border-t border-hairline bg-surface elev-hi"
                initial={reduce ? { opacity: 0 } : { y: "100%" }}
                animate={reduce ? { opacity: 1 } : { y: 0 }}
                exit={reduce ? { opacity: 0 } : { y: "100%" }}
                transition={{ duration: m.slow / 1000, ease: m.easeOut }}
              >
                <div className="mx-auto max-w-[560px] px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
                  <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-hairline" aria-hidden />
                  <div className="mb-1 flex items-center justify-between">
                    <Dialog.Title className="text-strong font-semibold text-hi">{title}</Dialog.Title>
                    <Dialog.Close aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-lo outline-none transition-colors duration-200 hover:bg-hairline/40 hover:text-hi focus-visible:text-hi">
                      <X size={16} strokeWidth={2} aria-hidden />
                    </Dialog.Close>
                  </div>
                  {children}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
