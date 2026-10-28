"""Original 24s rotation/dissolve fixture with static and hard-cut controls."""
from PIL import Image,ImageDraw
import subprocess,sys
out=sys.argv[1]
def pattern(seed):
 im=Image.new('RGB',(640,360),(215,220,230) if seed==1 else (180,205,170));d=ImageDraw.Draw(im)
 for j in range(52):
  x=(j*137+seed*41)%640;y=(j*79+seed*67)%360
  d.rectangle((x,y,x+30+j%50,y+18+j%40),fill=((j*31+seed*33)%210,(j*57)%190,(j*23+seed*21)%180))
 for x in range(0,640,80):d.line((x,0,x+100,360),fill=(30,60,100),width=5)
 return im
a,b,c=pattern(1),pattern(3),pattern(7)
p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size','640x360','-framerate','24','-i','pipe:0','-t','24','-c:v','libx264','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',out],stdin=subprocess.PIPE)
for n in range(576):
 t=n/24
 im=a.rotate(-12*t/8,resample=Image.Resampling.BICUBIC,fillcolor=(25,30,40)) if t<8 else b if t<12 else Image.blend(b,c,(t-12)/2) if t<14 else c if t<20 else a
 p.stdin.write(im.tobytes())
p.stdin.close();assert p.wait()==0
