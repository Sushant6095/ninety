import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { routes } from "../../lib/routes";

interface StubScreenProps {
  name: string;
  note?: string;
}

/** Branded placeholder for a route that isn't built yet — so every click lands somewhere real (Ninety), never dead. */
export function StubScreen({ name, note }: StubScreenProps) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="border-b border-hairline">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center px-4 sm:px-6">
          <Wordmark tag="WC26" />
        </div>
      </header>
      <main className="grid flex-1 place-items-center px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-card bg-surface text-heading text-lo ring-1 ring-inset ring-hairline">◷</div>
          <h1 className="font-display text-display font-bold tracking-tight text-hi">{name}</h1>
          <p className="mt-2 text-body leading-relaxed text-lo">{note ?? "This screen is next in the build. The route is live, so nothing dead-ends."}</p>
          <Link
            href={routes.matches}
            className="mt-5 inline-flex items-center gap-1 rounded-chip bg-surface px-4 py-2 text-body font-medium text-hi ring-1 ring-inset ring-hairline transition-colors duration-200 hover:ring-up/40"
          >
            ← Back to matches
          </Link>
        </div>
      </main>
    </div>
  );
}
