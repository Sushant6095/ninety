"use client";
import type { ReactNode } from "react";
import { Tooltip as TP } from "radix-ui";

/** ONE app-level Radix provider (mounted in app/layout.tsx): after the first tooltip opens, adjacent
 *  tooltips open INSTANTLY (skipDelayDuration) with no animation — Radix marks those `instant-open`
 *  and the .pop-content keyframe only runs on `delayed-open`. The whole toolbar feels faster. */
export function TooltipProvider({ children }: { children: ReactNode }) {
  return <TP.Provider delayDuration={200} skipDelayDuration={300}>{children}</TP.Provider>;
}

// shadcn's Tooltip (pulled from the registry) is radix Tooltip + bg-primary zinc styling. Re-skinned to Ninety:
// a quiet surface chip that scales in from its trigger (.pop-content — origin-aware, 150ms, ninety ease).
export function Tooltip({ content, children, side = "bottom" }: { content: ReactNode; children: ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <TP.Root>
      <TP.Trigger asChild>{children}</TP.Trigger>
      <TP.Portal>
        <TP.Content side={side} sideOffset={6} className="pop-content elev z-50 rounded-md border border-hairline bg-surface px-2.5 py-1 text-caption text-hi outline-none">
          {content}
        </TP.Content>
      </TP.Portal>
    </TP.Root>
  );
}
