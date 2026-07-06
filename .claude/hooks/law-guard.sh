#!/usr/bin/env bash
# PreToolUse guard: turns CLAUDE.md laws into machine enforcement. exit 2 = block.
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
NEW=$(echo "$INPUT"  | jq -r '.tool_input.content // .tool_input.new_string // empty')
OLD=$(echo "$INPUT"  | jq -r '.tool_input.old_string // empty')
[ -z "$FILE" ] && exit 0

# LAW 1 — no raw hex colors in web UI (design law): use CSS variables
if [[ "$FILE" == *apps/web/src/* && "$FILE" != *tokens.css* ]]; then
  if echo "$NEW" | grep -qE '#[0-9a-fA-F]{6}\b'; then
    echo "BLOCKED by design law: raw hex color in $FILE — use var(--…) from tokens.css (CLAUDE.md)." >&2; exit 2
  fi
fi

# LAW 2 — no gambling vocabulary in fan-facing UI (play-money invariant)
if [[ "$FILE" == *apps/web/src/*.tsx ]]; then
  if echo "$NEW" | grep -qiE '\b(bet|stake|wager)\b'; then
    echo "BLOCKED by play-money invariant: gambling vocabulary in $FILE — say price / trade / credits." >&2; exit 2
  fi
  if echo "$NEW" | grep -qiE '\bodds\b'; then
    echo "note: the word 'odds' appeared in UI copy — allowed in code identifiers, avoid in fan-facing text." >&2
  fi
fi

# LAW 3 — engine boundary: engine/ never imports http/ or ws/
if [[ "$FILE" == *apps/api/src/engine/* ]]; then
  if echo "$NEW" | grep -qE "from ['\"](\.\./)+(http|ws)/|from ['\"]\.\./\.\./(http|ws)"; then
    echo "BLOCKED by engine law: engine/ must not import from http/ or ws/ (single-writer boundary)." >&2; exit 2
  fi
fi

# LAW 4 — settlement stays proof-gated: never remove verify_txline_proof; no admin/override paths
if [[ "$FILE" == *programs/* ]]; then
  if echo "$NEW" | grep -qiE 'fn (admin|force|override)_?(settle|result)'; then
    echo "BLOCKED by trust law: admin/override settlement path is forbidden — settlement is proof-verified only." >&2; exit 2
  fi
  if [[ "$FILE" == *settle_market.rs* && -n "$OLD" ]]; then
    if echo "$OLD" | grep -q 'verify_txline_proof' && ! echo "$NEW" | grep -q 'verify_txline_proof'; then
      echo "BLOCKED by trust law: this edit removes verify_txline_proof from settle_market." >&2; exit 2
    fi
  fi
fi
exit 0
