"""Original 52s eight-shape transition fixture; generation truth is not passed to detectors."""
from PIL import Image,ImageDraw
import subprocess,sys,math
out=sys.argv[1]
def pattern(seed):
 im=Image.new('RGB',(640,360),(215,220,230) if seed==1 else (180,205,170));d=ImageDraw.Draw(im)
 for j in range(52):
  x=(j*137+seed*41)%640;y=(j*79+seed*67)%360
  d.rectangle((x,y,x+30+j%50,y+18+j%40),fill=((j*31+seed*33)%210,(j*57)%190,(j*23+seed*21)%180))
 for x in range(0,640,80):d.line((x,0,x+100,360),fill=(30,60,100),width=5)
 return im
a,b=pattern(1),pattern(7);black=Image.new('RGB',a.size)
p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size','640x360','-framerate','24','-i','pipe:0','-t','52','-c:v','libx264','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',out],stdin=subprocess.PIPE)
for n in range(1248):
 t=n/24;section=int(t//6);local=t%6;end=black if section==7 else b
 if t>=48 or local<2:im=a
 elif local>=4:im=end
 else:
  progress=(local-2)/2;shape=section//2;opening=section%2==0;size=progress if opening else 1-progress
  mask=Image.new('L',a.size,0);d=ImageDraw.Draw(mask)
  if shape==3:
   r=math.hypot(640,360)/2*size;d.ellipse((320-r,180-r,320+r,180+r),fill=255)
  else:
   w=640 if shape==1 else 640*size;h=360 if shape==0 else 360*size
   if w>0 and h>0:d.rectangle(((640-w)/2,(360-h)/2,(640+w)/2,(360+h)/2),fill=255)
  if not opening:mask=Image.eval(mask,lambda p:255-p)
  im=Image.composite(end,a,mask)
 p.stdin.write(im.tobytes())
p.stdin.close();assert p.wait()==0
