#!/bin/sh
set -eu
# Original test pattern, black on source frames 23 through 25 at 24 fps.
ffmpeg -v error -f lavfi -i 'testsrc2=size=320x180:rate=24:duration=2' -vf "drawbox=color=black:t=fill:enable='between(n,23,25)'" -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart -y dist/demo/dark-flash-fixture.mp4
