#!/bin/sh
set -eu
ffmpeg -v error -f lavfi -i 'color=c=0x315b90:s=360x640:r=24:d=12' -vf 'drawgrid=w=60:h=80:t=2:c=white@0.5' -an -c:v libx264 -pix_fmt yuv420p -movflags +faststart -y dist/demo/audit-portrait.mp4
