#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
ffmpeg_bin="${FFMPEG_BIN:-ffmpeg}"
for seconds in $(seq 0 4 48); do
  filename=$(printf 'references/frames/t%02d.jpg' "$seconds")
  "$ffmpeg_bin" -loglevel error -y -ss "$seconds" -i references/recording.mp4 -frames:v 1 -vf 'scale=1200:-1' "$filename"
done
"$ffmpeg_bin" -loglevel error -y -pattern_type glob -i 'references/frames/t*.jpg' -vf 'scale=400:-1,tile=4x4' -frames:v 1 references/contact-sheet.jpg
