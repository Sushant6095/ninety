"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell } from "lucide-react";
import * as React from "react";
import { initials, presenceColor } from "./presence";

/** godui notification-inbox, re-skinned to Ninety (the godui theme is not installed — every
 *  theme var/class maps onto tokens: card→surface, border→hairline, foreground→hi/lo,
 *  primary→up, destructive→neutral hairline reveal). Remote avatar URLs are removed (no
 *  runtime CDN); rows show the deterministic initials disc. The unread dot is up-green by
 *  default, chain-violet ONLY on on-chain rows, halt-amber ONLY on halt rows. */
export type Notification = {
  id: string;
  actor: string;
  /** What happened, e.g. "halted —". */
  action: string;
  /** The subject, e.g. "goal, Canada 38'". */
  target?: string;
  time: string;
  read?: boolean;
  /** Bucket label, e.g. "Today", "Yesterday". */
  group?: string;
  icon?: React.ReactNode;
  /** Semantic dot: default up-green; "chain" for on-chain rows ONLY, "halt" for halts ONLY. */
  accent?: "chain" | "halt";
};

export type NotificationInboxProps = React.HTMLAttributes<HTMLDivElement> & {
  notifications: Notification[];
  onRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onMarkAllRead?: () => void;
  title?: string;
};

const DOT: Record<"up" | "chain" | "halt", string> = {
  up: "bg-up",
  chain: "bg-chain",
  halt: "bg-halt",
};

function groupNotifications(items: Notification[]): [string, Notification[]][] {
  const order: string[] = [];
  const map = new Map<string, Notification[]>();
  for (const item of items) {
    const key = item.group ?? "Earlier";
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)?.push(item);
  }
  return order.map((key) => [key, map.get(key) as Notification[]]);
}

const NotificationInbox = React.forwardRef<HTMLDivElement, NotificationInboxProps>(
  ({ notifications, onRead, onArchive, onMarkAllRead, title = "Alerts", className, ...props }, ref) => {
    const reduce = useReducedMotion();
    const unread = notifications.filter((n) => !n.read).length;
    const groups = groupNotifications(notifications);

    return (
      <div
        ref={ref}
        data-slot="notification-inbox"
        className={`elev-hi flex w-full flex-col overflow-hidden rounded-card border border-hairline bg-surface ${className ?? ""}`}
        {...props}
      >
        <div className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-label font-semibold uppercase tracking-label text-lo">{title}</h3>
            <AnimatePresence>
              {unread > 0 ? (
                <motion.span
                  initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
                  className="num inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-up/15 px-1.5 text-label font-semibold tabular-nums text-up ring-1 ring-inset ring-up/25"
                >
                  {unread}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </div>
          {unread > 0 && onMarkAllRead ? (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="hit rounded-md px-2 py-1 text-label font-medium text-lo outline-none transition-colors duration-200 hover:bg-hairline/30 hover:text-hi focus-visible:shadow-[0_0_0_2px_var(--up)] active:scale-[0.97]"
            >
              Mark all read
            </button>
          ) : null}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <motion.div
                animate={reduce ? undefined : { y: [0, -4, 0] }}
                transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY }}
                className="flex size-12 items-center justify-center rounded-full bg-hairline/40 text-lo"
              >
                <Bell size={22} strokeWidth={2} aria-hidden />
              </motion.div>
              <p className="text-body font-medium text-hi">You&#39;re all caught up</p>
              <p className="text-caption text-lo">No new alerts.</p>
            </div>
          ) : (
            groups.map(([label, items]) => (
              <div key={label}>
                <div className="sticky top-0 z-10 bg-surface/90 px-4 py-1.5 text-label font-medium uppercase tracking-wide text-lo backdrop-blur-sm">
                  {label}
                </div>
                <ul>
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <NotificationRow key={item.id} notification={item} onRead={onRead} onArchive={onArchive} />
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    );
  },
);
NotificationInbox.displayName = "NotificationInbox";

function NotificationRow({
  notification,
  onRead,
  onArchive,
}: {
  notification: Notification;
  onRead?: (id: string) => void;
  onArchive?: (id: string) => void;
}) {
  const reduce = useReducedMotion();
  const color = presenceColor(notification.actor);

  return (
    // Stock godui animated row height on enter/exit — a layout property, so it's gone (motion law:
    // transform/opacity only). Rows fade + slide; the `layout` prop reflows siblings on transforms.
    <motion.li
      layout={!reduce}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, x: -80 }}
      transition={reduce ? { duration: 0.01 } : { type: "spring", stiffness: 320, damping: 32, mass: 0.9 }}
      className="relative overflow-hidden"
    >
      {/* Archive affordance revealed while swiping — neutral hairline wash, not a semantic color */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex w-24 items-center justify-end bg-gradient-to-l from-hairline/50 to-transparent pr-4 text-label font-medium text-lo">
        Archive
      </div>
      <motion.div
        drag={reduce ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.7, right: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) onArchive?.(notification.id);
        }}
        whileDrag={{ cursor: "grabbing" }}
        className={`relative flex items-start gap-3 bg-surface px-4 py-3 ${reduce ? "" : "cursor-grab active:cursor-grabbing"}`}
      >
        <button
          type="button"
          onClick={() => onRead?.(notification.id)}
          className="flex min-h-11 flex-1 items-start gap-3 rounded-md text-left outline-none transition-colors duration-200 hover:bg-hairline/20 focus-visible:shadow-[0_0_0_2px_var(--up)] active:scale-[0.99]"
        >
          <span className="relative mt-0.5 size-8 shrink-0">
            <span
              className="num flex size-full items-center justify-center overflow-hidden rounded-full text-label font-semibold text-hi ring-1 ring-inset ring-hairline"
              style={{ backgroundColor: color }}
            >
              {initials(notification.actor)}
            </span>
            {notification.icon ? (
              <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-bg text-lo ring-2 ring-surface">
                {notification.icon}
              </span>
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-body leading-snug text-hi">
              <span className="font-medium">{notification.actor}</span>{" "}
              <span className="text-lo">{notification.action}</span>{" "}
              {notification.target ? <span className="font-medium">{notification.target}</span> : null}
            </span>
            <span className="num mt-0.5 block text-label tabular-nums text-lo">{notification.time}</span>
          </span>
        </button>
        {!notification.read ? (
          <span className={`mt-2 size-2 shrink-0 rounded-full ${DOT[notification.accent ?? "up"]}`}>
            <span className="sr-only">Unread</span>
          </span>
        ) : null}
      </motion.div>
    </motion.li>
  );
}

export { NotificationInbox };
