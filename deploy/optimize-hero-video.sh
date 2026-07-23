#!/usr/bin/env bash
# Compress a raw hero clip into a small, web-optimized, muted, looping MP4 +
# a poster still, and drop both into the live frontend dist (runtime-fetched,
# no rebuild). Idempotent; safe to re-run.
#
#   bash optimize-hero-video.sh <raw-input> [target-seconds]
#
# Defaults: 720p, silent, faststart, CRF 30 (~1-3 MB for a 15s loop).
set -euo pipefail

RAW="${1:?usage: optimize-hero-video.sh <raw-input> [seconds]}"
SECONDS_CAP="${2:-20}"
DIST="/var/www/SMTravels/frontend/dist"
OUT_MP4="$DIST/hero-makkah.mp4"
OUT_POSTER="$DIST/hero-makkah-poster.jpg"

[ -f "$RAW" ] || { echo "input not found: $RAW"; exit 1; }

echo "→ encoding $OUT_MP4 (<=${SECONDS_CAP}s, 720p, muted, faststart)…"
ffmpeg -y -i "$RAW" -t "$SECONDS_CAP" \
  -vf "scale=-2:720" \
  -an \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -crf 30 -preset slow \
  -movflags +faststart \
  "$OUT_MP4"

echo "→ extracting poster $OUT_POSTER (frame @ 1s)…"
ffmpeg -y -ss 1 -i "$OUT_MP4" -frames:v 1 -q:v 3 "$OUT_POSTER"

chown deploy:deploy "$OUT_MP4" "$OUT_POSTER"
chmod 644 "$OUT_MP4" "$OUT_POSTER"

echo "done:"
ls -lh "$OUT_MP4" "$OUT_POSTER" | awk '{print "  "$5"\t"$9}'
