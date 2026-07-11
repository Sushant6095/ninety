"use client";
import type { ReactNode } from "react";
import { HoverCard as HC } from "radix-ui";

// shadcn's HoverCard (pulled from the registry) is radix HoverCard + zinc Tailwind (bg-popover/shadow-md/animate-in).
// This is that component RE-SKINNED to Ninety tokens: bg-surface, border-hairline, elev-hi, rounded-card. Same primitive.
export const HoverCard = HC.Root;
export const HoverCardTrigger = HC.Trigger;

export function HoverCardContent({ children, align = "start", sideOffset = 8, className = "" }: { children: ReactNode; align?: "start" | "center" | "end"; sideOffset?: number; className?: string }) {
  return (
    <HC.Portal>
      <HC.Content
        align={align}
        sideOffset={sideOffset}
        className={`elev-hi z-50 w-64 rounded-card border border-hairline bg-surface p-3 text-hi outline-none ${className}`}
      >
        {children}
      </HC.Content>
    </HC.Portal>
  );
}
