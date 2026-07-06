---
name: txline-integration
description: Use for any work touching TxLINE — adding endpoints, auth/token issues, stream handling, normalization, replay data, or filling packages/txline.
---
# TxLINE integration procedure
1) ONLY packages/txline calls TxLINE (law). 2) Auth: guest JWT → on-chain subscribe → /api/token/activate; BOTH headers on every call (Bearer jwt + X-Api-Token); never mix devnet origin with mainnet activation. 3) Every payload → canonical Envelope (packages/schema) with (source, source_seq) idempotency, partition key match_id. 4) Streams: SSE with heartbeat + gap detection; on gap → snapshot recovery, never quote blind. 5) New endpoint? add typed wrapper + save a sample payload to docs/txline-samples/ + list it in docs/SUBMISSION.md.
References: docs/TXLINE-MAP.md (the map + Day-0 checklist) · txline.txodds.com/documentation/quickstart
