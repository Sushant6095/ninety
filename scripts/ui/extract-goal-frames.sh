#!/usr/bin/env bash
# Slice a source clip into a numbered JPG sequence for GoalReplayScroll (the landing scroll-scrub).
# Landing-only asset (ADR-058). Output: apps/web/public/frames/goal/goal_0001.jpg …
#
# ── LEGAL (read before you pick a clip) ──────────────────────────────────────────────────────────────
# Real broadcast footage + a named player's likeness (e.g. an actual Messi goal) is FIFA/broadcaster +
# personality-rights owned. Ninety is a play-money, "legal armor" product — do NOT ship real match footage
# or a real, named player on the public landing. Use one of: (a) an ORIGINAL stylised/rotoscoped goal render,
# (b) a properly LICENSED or CC-0 clip, (c) an anonymous silhouetted striker. The scrub mechanism is identical
# whatever the source — only the asset's provenance differs. Log the source + licence in design/PROVENANCE.md.
#
# Usage:
#   scripts/ui/extract-goal-frames.sh <input.mp4> [FRAMES=90] [WIDTH=1600] [QUALITY=3] [NAME=goal]
#     FRAMES  — target frame count (set GoalReplayScroll frameCount to the ACTUAL count printed at the end)
#     WIDTH   — long-edge px (1600 is plenty full-bleed; smaller = lighter landing)
#     QUALITY — ffmpeg -q:v (2=best/large … 5=smaller; 3 ≈ JPEG q72, the sweet spot)
#     NAME    — output subdir + file prefix → apps/web/public/frames/<NAME>/<NAME>_0001.jpg (default goal)
set -euo pipefail

IN="${1:?usage: extract-goal-frames.sh <input.mp4> [frames] [width] [quality] [name]}"
FRAMES="${2:-90}"
WIDTH="${3:-1600}"
QUALITY="${4:-3}"
NAME="${5:-goal}"
OUT="apps/web/public/frames/${NAME}"

command -v ffmpeg >/dev/null || { echo "ffmpeg not found — brew install ffmpeg"; exit 1; }
[ -f "$IN" ] || { echo "input not found: $IN"; exit 1; }

# Duration → fps that yields ~FRAMES evenly across the clip (so scrub speed is uniform).
DUR="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")"
FPS="$(awk -v f="$FRAMES" -v d="$DUR" 'BEGIN{ if(d<=0){print 24}else{printf "%.4f", f/d} }')"
echo "input=$IN  dur=${DUR}s  target=${FRAMES} frames  → fps=${FPS}  width=${WIDTH}  q=${QUALITY}"

rm -rf "$OUT"; mkdir -p "$OUT"
# even width (JPEG needs it), keep aspect; start numbering at 1 to match framePath()
ffmpeg -hide_banner -loglevel error -i "$IN" \
  -vf "fps=${FPS},scale=${WIDTH}:-2:flags=lanczos" \
  -q:v "${QUALITY}" -start_number 1 "$OUT/${NAME}_%04d.jpg"

COUNT="$(find "$OUT" -name "${NAME}_*.jpg" | wc -l | tr -d ' ')"
BYTES="$(du -sh "$OUT" | cut -f1)"
echo "────────────────────────────────────────────────────────"
echo "wrote ${COUNT} frames to ${OUT}  (${BYTES} total)"
echo "→ set frameCount={${COUNT}} and framePath={(n)=>\`/frames/${NAME}/${NAME}_\${String(n).padStart(4,'0')}.jpg\`}"
echo "→ add a design/PROVENANCE.md row: source clip + licence + this script"
[ "$COUNT" -gt 140 ] && echo "⚠ ${COUNT} frames is heavy for a landing — consider FRAMES≈90 to protect the tick path."
exit 0
