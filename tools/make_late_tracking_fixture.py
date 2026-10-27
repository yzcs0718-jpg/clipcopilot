"""Prefix the original spatial fixture with two seconds of blank background.
This is an original negative/late-arrival reference, not a model answer input.
Usage: python tools/make_late_tracking_fixture.py
"""
from pathlib import Path
import subprocess
root = Path(__file__).resolve().parents[1]
subprocess.run(['ffmpeg','-v','error','-y','-f','lavfi','-i',
    'color=c=0x161f32:s=640x360:r=24:d=2','-i',
    str(root/'dist/demo/spatial-fixture.mp4'),'-filter_complex',
    '[0:v][1:v]concat=n=2:v=1:a=0[out]','-map','[out]',
    '-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',
    str(root/'dist/demo/late-tracking-fixture.mp4')],check=True)
