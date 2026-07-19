"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell } from "lucide-react";
import { motion as m } from "../../../design/motion";
import { NotificationInbox, type Notification } from "../../../components/vendor/godui/notification-inbox";

// The seed feed — the same fixture world as the board (the CAN–MAR halt, a settlement proof, a market open, a
// leaderboard note). No self-referential identity: the signed-in user's own alerts come from real activity, so
// this feed carries only world events. Chain accent ONLY on the on-chain row; halt accent ONLY on the halt row.
const SEED: Notification[] = [
  { id: "n-halt", actor: "CAN – MAR", action: "halted", target: "goal, Canada 38'", time: "2m ago", group: "Today", accent: "halt" },
  // JPN–CRO: the left rail names JPN–CRO as the LAST proof, so the freshest proof alert must be the same match
  // (read-out-loud law — two chrome elements may not disagree).
  { id: "n-proof", actor: "JPN – CRO", action: "settlement proof verified", target: "on-chain", time: "44m ago", group: "Today", accent: "chain" },
  { id: "n-open", actor: "GER – COL", action: "opens for trading at", target: "7:00pm", time: "3h ago", group: "Today" },
  { id: "n-volume", actor: "ESP – JPN", action: "is today's most-traded market at", target: "231.8k CR", time: "5h ago", group: "Today", read: true },
  { id: "n-leader", actor: "@pitchwizard", action: "tops the", target: "World Cup leaderboard", time: "1d ago", group: "Yesterday", read: true },
];

/** The header alerts bell — godui notification-inbox re-skinned to tokens behind a Ninety trigger:
 *  44px hit, hover/focus-visible/active states, mono unread badge, popover panel on the motion
 *  tokens. Escape / outside click closes; reduced motion opens instantly. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>(SEED);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const unread = items.filter((n) => !n.read).length;

  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: globalThis.PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread > 0 ? `Alerts, ${unread} unread` : "Alerts"}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative grid h-11 w-11 place-items-center rounded-full text-lo outline-none transition-colors duration-200 hover:bg-surface hover:text-hi focus-visible:shadow-[0_0_0_2px_var(--up)] active:scale-[0.97] active:bg-hairline/40"
      >
        <Bell size={17} strokeWidth={2} aria-hidden />
        {unread > 0 && (
          <span className="num absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-up px-1 text-label font-semibold leading-none text-bg ring-2 ring-bg">
            {unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Alerts"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={reduce ? m.reduced : { duration: m.transition / 1000, ease: m.easeOut }}
            // -right-[44px] pulls the panel's right edge under the header avatar so w-80 clears
            // narrow viewports; the max-w keeps it on-screen down to 320px.
            className="absolute -right-[44px] top-12 z-50 w-80 max-w-[calc(100vw-24px)] origin-top-right sm:w-96"
          >
            <NotificationInbox
              notifications={items}
              onRead={(id) => setItems((cur) => cur.map((n) => (n.id === id ? { ...n, read: true } : n)))}
              onArchive={(id) => setItems((cur) => cur.filter((n) => n.id !== id))}
              onMarkAllRead={() => setItems((cur) => cur.map((n) => ({ ...n, read: true })))}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
