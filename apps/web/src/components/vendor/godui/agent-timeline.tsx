"use client";
// godui agent-timeline — re-skinned to Ninety tokens: up = done, lo = pending, down = error.
// `tone="chain"` tints ONE step's marker + connector violet (on-chain references only — law).
// Collapsible detail rows stay caller-styled (font-mono for ids/sigs). Reduced motion → no
// spring fill, instant states.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as React from "react";
import { DotmSquare3 } from "@/components/vendor/dotmatrix/dotm-square-3";
import m from "@/design/motion";

export type StepStatus = "pending" | "running" | "success" | "error";
export type StepTone = "up" | "chain";

export type AgentTimelineProps = React.HTMLAttributes<HTMLOListElement>;

const AgentTimeline = React.forwardRef<HTMLOListElement, AgentTimelineProps>(
  ({ className, children, ...props }, ref) => (
    <ol
      ref={ref}
      data-slot="agent-timeline"
      className={`flex flex-col ${className ?? ""}`}
      {...props}
    >
      {children}
    </ol>
  ),
);
AgentTimeline.displayName = "AgentTimeline";

export type AgentStepProps = Omit<
  React.HTMLAttributes<HTMLLIElement>,
  "title"
> & {
  status?: StepStatus;
  /** Accent for the marker + connector. "chain" is reserved for on-chain steps. */
  tone?: StepTone;
  title: React.ReactNode;
  /** Optional sub-label (id, duration, …). */
  meta?: React.ReactNode;
  /** Collapsible body (proof detail, tx sig). */
  children?: React.ReactNode;
  defaultOpen?: boolean;
  /** Hide the connector below this step (use on the last item). */
  last?: boolean;
};

const STATUS_RING: Record<StepTone, Record<StepStatus, string>> = {
  up: {
    pending: "border-hairline bg-bg text-lo",
    running: "border-up bg-up/10 text-up",
    success: "border-up/60 bg-up/15 text-up",
    error: "border-down/60 bg-down/15 text-down",
  },
  chain: {
    pending: "border-hairline bg-bg text-lo",
    running: "border-chain bg-chain/10 text-chain",
    success: "border-chain/60 bg-chain/15 text-chain",
    error: "border-down/60 bg-down/15 text-down",
  },
};

const CONNECTOR_FILL: Record<StepTone, Record<StepStatus, string>> = {
  up: { pending: "bg-hairline", running: "bg-up/50", success: "bg-up/70", error: "bg-down/70" },
  chain: { pending: "bg-hairline", running: "bg-chain/50", success: "bg-chain/70", error: "bg-down/70" },
};

const AgentStep = React.forwardRef<HTMLLIElement, AgentStepProps>(
  (
    {
      status = "pending",
      tone = "up",
      title,
      meta,
      children,
      defaultOpen = false,
      last = false,
      className,
      ...props
    },
    ref,
  ) => {
    const reduce = useReducedMotion();
    const [open, setOpen] = React.useState(defaultOpen);
    const hasBody = Boolean(children);
    const t = reduce ? { duration: 0 } : m.spring;

    return (
      <li
        ref={ref}
        data-slot="agent-step"
        data-status={status}
        className={`relative flex gap-3 pb-2 ${className ?? ""}`}
        {...props}
      >
        {/* Rail */}
        <div className="relative flex flex-col items-center">
          <span
            className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-chip border transition-colors ${STATUS_RING[tone][status]}`}
          >
            {status === "running" ? (
              // The app loading motif (dotmatrix spiral) — rides currentColor so the
              // tone ring (up/chain) colors it; reduced motion → static grid inside.
              <DotmSquare3 size={14} dotSize={2} className="shrink-0" />
            ) : status === "success" ? (
              <CheckIcon className="size-3.5" />
            ) : status === "error" ? (
              <CloseIcon className="size-3.5" />
            ) : (
              <span className="size-1.5 rounded-chip bg-current" />
            )}
            {status === "running" && (
              <span className={`absolute inset-0 animate-ping rounded-chip border motion-reduce:animate-none ${tone === "chain" ? "border-chain/50" : "border-up/50"}`} />
            )}
          </span>
          {!last && (
            <span className="relative my-1 w-px flex-1 overflow-hidden rounded-chip bg-hairline">
              <motion.span
                initial={false}
                animate={{
                  scaleY:
                    status === "success" || status === "error"
                      ? 1
                      : status === "running"
                        ? 0.5
                        : 0,
                }}
                transition={t}
                className={`absolute inset-0 origin-top ${CONNECTOR_FILL[tone][status]}`}
              />
            </span>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 pb-2">
          <button
            type="button"
            disabled={!hasBody}
            aria-expanded={hasBody ? open : undefined}
            onClick={() => hasBody && setOpen((o) => !o)}
            className={`hit flex w-full items-center gap-2 rounded py-0.5 text-left outline-none ${
              hasBody
                ? "cursor-pointer transition-opacity duration-fast hover:opacity-80 focus-visible:ring-2 focus-visible:ring-up focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.99]"
                : "cursor-default"
            }`}
          >
            <span
              className={`truncate text-strong font-semibold ${
                status === "error" ? "text-down" : status === "pending" ? "text-lo" : "text-hi"
              } ${status === "running" ? "motion-safe:animate-pulse" : ""}`}
            >
              {title}
            </span>
            {meta != null && (
              <span className="num shrink-0 text-caption tabular-nums text-lo">
                {meta}
              </span>
            )}
            {hasBody && (
              <ChevronIcon
                className={`ml-auto size-4 shrink-0 text-lo transition-transform ${open ? "rotate-90" : ""}`}
              />
            )}
          </button>

          <AnimatePresence initial={false}>
            {hasBody && open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={t}
                className="overflow-hidden"
              >
                <div className="mt-1.5 rounded-card border border-hairline bg-bg/40 p-3 text-caption leading-relaxed text-lo">
                  {children}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </li>
    );
  },
);
AgentStep.displayName = "AgentStep";

type IconProps = { className?: string };
function CheckIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
function CloseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function ChevronIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export { AgentStep, AgentTimeline };
