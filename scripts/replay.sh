#!/usr/bin/env bash
# One-command judge demo: replay a finished match through the ingest pipeline at Nx (default 10x).
# The API publishes a replay_request system signal; worker-ingest walks the fixture's buckets onto the
# same topics, so downstream consumers (engine, ws, cortex) receive ordered events in relative time.
#
# usage: bash scripts/replay.sh <fixture> [speed]
#   API=http://host:4000  ADMIN_TOKEN=... bash scripts/replay.sh 18193785 10
set -euo pipefail

API="${API:-http://localhost:4000}"
FIXTURE="${1:?usage: replay.sh <fixture> [speed]}"
SPEED="${2:-10}"

curl -fsS -X POST "$API/admin/replay" \
  -H 'content-type: application/json' \
  -H "x-admin-token: ${ADMIN_TOKEN:-}" \
  -d "{\"match_id\":\"${FIXTURE}\",\"speed\":${SPEED}}"
echo
