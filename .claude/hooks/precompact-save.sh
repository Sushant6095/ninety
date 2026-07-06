#!/usr/bin/env bash
mkdir -p docs/adr && touch docs/adr/inbox.md
echo "- $(date -u +%FT%TZ) compaction occurred — if a decision was made this session and not yet ADR'd, capture it now (/adr)." >> docs/adr/inbox.md
exit 0
