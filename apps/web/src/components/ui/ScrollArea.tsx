"use client";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import type { ReactNode } from "react";

/** shadcn/ui scroll-area (`pnpm dlx shadcn@latest add @shadcn/scroll-area`), ported onto the already-installed
 *  unified `radix-ui` package (its one dependency) and re-skinned to tokens: hairline thumb, bare track, 6px
 *  rail. Pass the height cap via className (lands on the Viewport). Keyboard scroll works out of the box —
 *  the viewport is focusable and the browser drives it; the custom bar is presentation only. */
export function ScrollArea({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <ScrollAreaPrimitive.Root type="auto" className="relative overflow-hidden">
      <ScrollAreaPrimitive.Viewport className={`w-full ${className}`}>{children}</ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        className="flex w-1.5 touch-none select-none bg-transparent p-px"
      >
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-hairline transition-colors duration-200 hover:bg-lo/40" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}
