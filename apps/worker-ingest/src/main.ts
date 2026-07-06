// L1: TxLINE → normalize → bus. NO business logic (their doc got this right — we agree).
// Streams: odds (StablePrice), score events. Polled: fixtures, proofs.
import {} from "@omnipitch/txline";
async function main() { /* connect streams → normalizer → publish odds.raw / match.events / fixtures */ }
main();
