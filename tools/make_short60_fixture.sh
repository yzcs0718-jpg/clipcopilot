#!/bin/sh
set -eu
# Original FFmpeg test pattern. One white source frame at 31/60 seconds.
ffmpeg -v error -f lavfi -i "testsrc2=size=320x180:rate=60:duration=1" -vf "drawbox=color=white:t=fill:enable='eq(n,31)'" -an -c:v libx264 -preset medium -pix_fmt yuv420p -movflags +faststart -y dist/demo/short60-fixture.mp4
