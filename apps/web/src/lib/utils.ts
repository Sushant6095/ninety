// Class-name join for registry-pulled components (they import { cn } from "@/lib/utils").
// Dependency-free on purpose: no clsx/tailwind-merge — vendor pulls are re-skinned to token
// classes with no conflicting utilities, so a filter-join is all cn ever has to do here.
export type ClassValue = string | number | null | false | undefined | ClassValue[] | Record<string, boolean | null | undefined>;

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const i of inputs) {
    if (!i && i !== 0) continue;
    if (typeof i === "string" || typeof i === "number") out.push(String(i));
    else if (Array.isArray(i)) {
      const inner = cn(...i);
      if (inner) out.push(inner);
    } else if (typeof i === "object") {
      for (const [k, v] of Object.entries(i)) if (v) out.push(k);
    }
  }
  return out.join(" ");
}
