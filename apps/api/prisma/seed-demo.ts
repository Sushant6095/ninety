// Demo seed for the live-stack proof (Track 2): one finished WC26 fixture (18193785 USA v Belgium) plus the
// three markets the archived odds sample produces, and a demo user to mint a dev JWT against. The market ids
// MUST equal cortex's `${fixtureId}:${superOddsType}:${marketParameters}` so the live marks (Redis) join the
// Postgres market rows on GET /markets. Not a product feature — a bootstrap so the discovery list isn't empty
// until real seed-fixtures (TxLINE-backed) lands. Idempotent (upsert).
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FIXTURE = "18193785";
const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001"; // fixed → JWT sub is stable across reseeds

const MARKETS: Array<{ id: string; kind: string }> = [
  { id: `${FIXTURE}:OVERUNDER_PARTICIPANT_GOALS:line=5`, kind: "OU_5" },
  { id: `${FIXTURE}:OVERUNDER_PARTICIPANT_GOALS:line=4.5`, kind: "OU_4.5" },
  { id: `${FIXTURE}:ASIANHANDICAP_PARTICIPANT_GOALS:line=0.5`, kind: "AH_0.5" },
];

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: { id: DEMO_USER_ID, handle: "demo", walletPubkey: "DemoWa11etPubkey1111111111111111111111111111", authKind: "embedded" },
  });

  await prisma.match.upsert({
    where: { id: FIXTURE },
    update: { status: "LIVE" },
    create: { id: FIXTURE, stage: "Group E", kickoffAt: new Date(1783382400000), status: "LIVE", home: "USA", away: "Belgium" },
  });

  for (const m of MARKETS) {
    await prisma.market.upsert({
      where: { id: m.id },
      update: { status: "LIVE" },
      create: { id: m.id, matchId: FIXTURE, kind: m.kind, status: "LIVE", bParam: 300 },
    });
  }

  console.log(JSON.stringify({ evt: "seed.done", user: DEMO_USER_ID, match: FIXTURE, markets: MARKETS.map((m) => m.id) }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
