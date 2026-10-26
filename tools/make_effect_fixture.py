"""Generate original geometric test footage; no third-party assets or personal data."""
from PIL import Image, ImageDraw, ImageFont
import math, subprocess, sys
out=sys.argv[1]
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',40)
p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size','640x360','-framerate','30','-i','pipe:0','-f','lavfi','-i','sine=frequency=440:duration=7','-t','7','-c:v','libx264','-crf','22','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',out],stdin=subprocess.PIPE)
for n in range(210):
 t=n/30;motion=3 if 3<=t<4 else t
 im=Image.new('RGB',(640,360),(20,32,60));d=ImageDraw.Draw(im)
 for j in range(8):
  x=(motion*80+j*90)%760-60;y=60+50*math.sin(j+motion)
  d.ellipse((x,y,x+65,y+65),fill=(60+j*12,90+j*8,160+j*8))
 d.rounded_rectangle((38+motion*12,230,600,305),radius=12,fill=(245,245,240))
 d.text((52+motion*12,244),'CUT TO THE BEAT',font=font,fill=(10,20,35))
 if t<.5:im=Image.blend(Image.new('RGB',im.size),im,t/.5)
 if 1<=t<1.2:im=Image.new('RGB',im.size,'white')
 p.stdin.write(im.tobytes())
p.stdin.close();assert p.wait()==0
