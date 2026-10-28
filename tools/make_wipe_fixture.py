"""Original 28s four-direction wipe with hard-cut/static controls. No truth is passed to analysis."""
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
a,b=pattern(1),pattern(7)
p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size','640x360','-framerate','24','-i','pipe:0','-t','28','-c:v','libx264','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',out],stdin=subprocess.PIPE)
for n in range(672):
 t=n/24;section=int(t//6);local=t%6
 if t>=24:im=a
 elif local<2:im=a
 elif local>=4:im=b
 else:
  progress=(local-2)/2;im=a.copy()
  box=(0,0,round(640*progress),360) if section==0 else (round(640*(1-progress)),0,640,360) if section==1 else (0,0,640,round(360*progress)) if section==2 else (0,round(360*(1-progress)),640,360)
  im.paste(b.crop(box),box[:2])
 p.stdin.write(im.tobytes())
p.stdin.close();assert p.wait()==0
