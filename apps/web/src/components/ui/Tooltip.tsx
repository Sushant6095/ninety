"use client";
import type { ReactNode } from "react";
import { Tooltip as TP } from "radix-ui";

// shadcn's Tooltip (pulled from the registry) is radix Tooltip + bg-primary zinc styling. Re-skinned to Ninety:
// a quiet surface chip. Self-contained (bundles its Provider) so callers just wrap a trigger.
export function Tooltip({ content, children, side = "bottom" }: { content: ReactNode; children: ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <TP.Provider delayDuration={200}>
      <TP.Root>
        <TP.Trigger asChild>{children}</TP.Trigger>
        <TP.Portal>
          <TP.Content side={side} sideOffset={6} className="elev z-50 rounded-md border border-hairline bg-surface px-2.5 py-1 text-caption text-hi outline-none">
            {content}
          </TP.Content>
        </TP.Portal>
      </TP.Root>
    </TP.Provider>
  );
}
