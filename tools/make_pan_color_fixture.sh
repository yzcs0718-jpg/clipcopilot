#!/bin/sh
set -eu
pattern_path=$(mktemp --suffix=.png)
trap 'rm -f "$pattern_path"' EXIT
ffmpeg -v error -f lavfi -i 'testsrc2=size=400x240:rate=1:duration=1' -frames:v 1 -y "$pattern_path"
# Original static texture, cropped left/up; crop offsets clamp at source edges.
# Blue source frames 78..80 at 24 fps. Detector never reads these true values.
ffmpeg -v error -loop 1 -framerate 24 -i "$pattern_path" -t 4 -vf "crop=320:180:x='40+15*t':y='30+6*t',drawbox=color=0x0080ff:t=fill:enable='between(n,78,80)'" -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart -y dist/demo/pan-color-fixture.mp4
