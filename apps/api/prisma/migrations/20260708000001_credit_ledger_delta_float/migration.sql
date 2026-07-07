-- CreditLedger.delta is a fractional play-money credit amount (LMSR cost is a float), not an integer (ADR-027).
-- Σ(delta) per user is the user's balance (ADR-003 authority). Int would reject every real credit write.
ALTER TABLE "CreditLedger" ALTER COLUMN "delta" SET DATA TYPE DOUBLE PRECISION;
