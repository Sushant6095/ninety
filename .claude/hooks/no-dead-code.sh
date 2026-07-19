#!/usr/bin/env bash
# no-dead-code gate (chained AFTER stop-gate.sh — does NOT replace it). Blocks a session from stopping while it
# has shipped dead backend/frontend code. Three checks, matching the P1 preflight:
#   (a) a registered API endpoint with 0 frontend callers      — an API nobody calls is dead weight
#   (b) apps/web/src/lib/api.ts or lib/ws.ts with 0 importers  — the wiring layer that must not sit unused
#   (c) a route file that is still a bare `export {};` stub     — an unbuilt route masquerading as done
#
# ALLOWLIST (documented, load-bearing): webhooks, admin, auth are server-to-server / callback surfaces with no
# frontend caller BY DESIGN (Helius webhook, replay tooling, OTP/OAuth callbacks). (a) skips these files.
#
# HEURISTIC (declared honestly): frontend-caller detection greps apps/web/src for the endpoint's first path
# segment (route "/markets/:id" -> look for "/markets" at any call site). Dynamic paths like `/markets/${id}`
# match on the prefix. This is a lenient prefix heuristic — one real caller anywhere clears the endpoint.
#
# NOTE: no `set -e` on purpose — this script is grep-heavy and a no-match (grep exit 1) is normal, not an error.

INPUT=$(cat 2>/dev/null || true)
if command -v jq >/dev/null 2>&1; then
  [ "$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)" = "true" ] && exit 0
fi

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$ROOT" 2>/dev/null || exit 0
ROUTES="apps/api/src/http/routes"
WEB="apps/web/src"

violations=""
add() { violations="${violations}${violations:+ · }$1"; }

# (c) bare-stub route files -------------------------------------------------------------------------
if [ -d "$ROUTES" ]; then
  for f in "$ROUTES"/*.ts; do
    [ -e "$f" ] || continue
    case "$f" in *.test.ts) continue;; esac
    body=$(grep -vE '^[[:space:]]*(//|$)' "$f" 2>/dev/null | tr -d '[:space:]')
    [ "$body" = "export{};" ] && add "(c) $(basename "$f") is still a bare 'export {};' stub"
  done
fi

# (b) unused wiring layer ---------------------------------------------------------------------------
for lib in api ws; do
  libfile="$WEB/lib/${lib}.ts"
  [ -f "$libfile" ] || continue
  # match any import whose module path ends in /<lib> — covers "./ws", "@/lib/api", "../../lib/ws", etc.
  importers=$(grep -rElE "[\"'][^\"']*/${lib}[\"']" "$WEB" --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v "/lib/${lib}\.ts$")
  [ -z "$importers" ] && add "(b) lib/${lib}.ts has 0 importers"
done

# (a) endpoints with 0 frontend callers -------------------------------------------------------------
if [ -d "$ROUTES" ] && [ -d "$WEB" ]; then
  segs=$(
    for f in "$ROUTES"/*.ts; do
      [ -e "$f" ] || continue
      base=$(basename "$f")
      # NOTE: `case` inside $(...) breaks macOS bash 3.2 (the pattern ')' closes the subshell) — use [[ ]].
      if [[ "$base" == admin.ts || "$base" == webhooks.ts || "$base" == auth.ts || "$base" == *.test.ts ]]; then continue; fi
      grep -oE 'app\.(get|post|put|patch|delete)\("/[a-zA-Z0-9_-]+' "$f" 2>/dev/null \
        | grep -oE '/[a-zA-Z0-9_-]+$'
    done | sort -u
  )
  for seg in $segs; do
    [ -z "$seg" ] && continue
    # a caller = the segment appearing right after a quote/backtick in any web source file
    if ! grep -rqF "\"$seg" "$WEB" --include='*.ts' --include='*.tsx' 2>/dev/null \
       && ! grep -rqF "'$seg" "$WEB" --include='*.ts' --include='*.tsx' 2>/dev/null \
       && ! grep -rqF "\`$seg" "$WEB" --include='*.ts' --include='*.tsx' 2>/dev/null; then
      add "(a) endpoint '$seg' has no frontend caller"
    fi
  done
fi

if [ -n "$violations" ]; then
  reason="no-dead-code gate: this session shipped code with no consumer — ${violations}. Allowlist exempt from (a): admin, webhooks, auth. Wire it (NEXT_PUBLIC_USE_FIXTURES) or remove it, then stop."
  if command -v jq >/dev/null 2>&1; then
    jq -cn --arg r "$reason" '{decision:"block", reason:$r}'
  else
    printf '{"decision":"block","reason":"%s"}\n' "$(printf '%s' "$reason" | sed 's/"/\\"/g')"
  fi
  exit 0
fi

echo "$(date -u +%FT%TZ) no-dead-code clean" >> .claude/trace/sessions.log 2>/dev/null || true
exit 0
