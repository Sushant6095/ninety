-- Idempotency inbox for the bus→DB projection (ADR-027).
-- One row per consumed event_id; inserted in the SAME transaction as the projected rows, so re-consuming an
-- event hits this PK and the whole apply is skipped → exactly-once projection ("zero duplicate rows on re-consume").
CREATE TABLE "ProcessedEvent" (
    "eventId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("eventId")
);
