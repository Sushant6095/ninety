import type { Metadata } from "next";
import { DocTitle, Lead, H2, P, Callout, Code } from "../../../features/docs/DocsProse";
import { ArchDiagram } from "../../../features/docs/ArchDiagram";

export const metadata: Metadata = {
  title: "Architecture — Ninety docs",
  description: "A TypeScript monorepo with a Python quant worker and a Rust/Anchor program. Single-writer engine, two-plane event bus, on-chain proof verification.",
};

const PARTS: readonly { name: string; body: string }[] = [
  { name: "Fastify API", body: "30 endpoints, fully typed and schema'd, with live Swagger. Auth, markets, quotes, orders, portfolio, moments, leaderboard, search, events, and a cost-aware rich-data proxy." },
  { name: "Single-writer LMSR engine", body: "the market maker. Exactly one writer owns market state, enforced by a lease at boot, using journal-then-ack: the intent is journaled before it is acknowledged, so a crash cannot lose or double-apply a fill. One match is low-throughput; correctness matters far more than horizontal scale, so a single writer is the right trade." },
  { name: "Redis Streams bus", body: "two planes: domain events and sys.* signals. No service ever calls another directly. The ingest worker can die without taking prices down. This is the decision that makes every other component replaceable." },
  { name: "cortex (Python)", body: "the quant worker. De-vigging, the Poisson and Skellam inversions, and the Dixon-Coles grid. Python because scipy is worth the polyglot cost." },
  { name: "ingest / jobs workers", body: "live TxLINE consumption; the settlement saga, the AI Booth, and the EarlyWhistle Telegram bot." },
  { name: "Anchor program (Solana)", body: "verifies TxLINE's signed statistics on-chain before a market can settle." },
  { name: "Storage", body: "Postgres via Prisma (Aiven), Valkey for cache and streams (Aiven)." },
];

export default function ArchitecturePage() {
  return (
    <article>
      <DocTitle eyebrow="Architecture">How Ninety is built</DocTitle>
      <Lead>
        A TypeScript monorepo with a Python quant worker and a Rust/Anchor program. Every significant decision
        is recorded — 87 architecture decision records in <span className="num text-up">docs/adr/</span>, written
        before the code.
      </Lead>

      <H2>The live path</H2>
      <ArchDiagram />

      <H2>The parts</H2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {PARTS.map((p) => (
          <div key={p.name} className="rounded-card border border-hairline bg-surface px-4 py-3.5">
            <h3 className="num text-caption font-semibold text-hi">{p.name}</h3>
            <p className="mt-1 text-caption leading-[1.65] text-lo">{p.body}</p>
          </div>
        ))}
      </div>

      <H2>The two-source law</H2>
      <P>
        TxLINE owns everything that <strong>moves</strong> during a match — scores, goals, halts, prices,
        results. Baked static data owns only what <strong>sits still</strong> — flags, crests, stadiums, the
        104-fixture skeleton. The tie-breaker is simple: if it changes during a match, TxLINE is the source of
        truth.
      </P>
      <P>
        This exists because the free data tiers are rate-limited (10 requests/minute and 100/day), which makes
        per-request upstream calls impossible. So static data is fetched once at build time and committed.
      </P>

      <H2>On-chain, and the forge</H2>
      <P>
        Access to the feed is gated by a real Solana transaction — a guest token, an on-chain subscribe, then
        activation. The chain is the gate, not a logo. Results are verified by the program, and{" "}
        <strong>there is no admin result path, by design.</strong>
      </P>
      <P>
        Building the settlement path, we adversarially reviewed it and found that{" "}
        <strong>TxLINE&#39;s proof does not bind match finality on-chain</strong>. A permissionless caller could
        settle a wrong result using a genuine mid-match proof by selecting the batch. So settlement is{" "}
        <strong>fail-closed on purpose</strong>:
      </P>
      <Code tone="halt">pub const SETTLEMENT_LIVE: bool = false;   // compile-time, first statement of the settle handler</Code>
      <P>
        It is a compile-time constant, not a config flag — flipping it requires a source change, a rebuild and
        a redeploy. We filed the finding back to TxODDS. We will not ship a settlement we can prove is
        forgeable, even in play-money.
      </P>

      <H2>Design system</H2>
      <P>
        Every colour is a design token; a raw hex in a component fails the build. Numbers are SF Mono with
        tabular figures and one decimal; everything else is the system font — that single split is most of why
        the interface reads like an exchange rather than a dashboard. Motion is 150–250ms ease-out, and{" "}
        <span className="num text-hi">prefers-reduced-motion</span> is honoured everywhere.
      </P>

      <H2>Verified, not asserted</H2>
      <P>
        279 automated tests. A screen is not considered done until it has been screenshotted, looked at, and
        passed the <strong>read-out-loud test</strong> — enumerate every text element and confirm no two
        contradict each other. That test has caught more real bugs than every automated tool in the stack.
      </P>
    </article>
  );
}
