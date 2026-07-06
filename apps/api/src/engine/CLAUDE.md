# engine/ session memory
This is the single-writer trading core. Laws (hook-enforced + reviewed by engine-guardian):
journal-then-ack · deterministic apply (time from events, never wall clock) · amm.ts stays pure math · no http/ws imports · halted markets reject orders with MARKET_HALTED.
After ANY change here: tests must pass (hook runs them) and delegate a review to the engine-guardian subagent.
