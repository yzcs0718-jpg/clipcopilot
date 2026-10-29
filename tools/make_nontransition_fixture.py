"""Original 28s shake/desaturation/restore-color clip, with static/local-motion controls."""
from PIL import Image,ImageDraw
import numpy as np,subprocess,sys,math
out=sys.argv[1]
def pattern(seed,size=(640,360),mode='normal'):
 rng=np.random.default_rng(seed);arr=rng.integers(25,235,(24,40,3),dtype=np.uint8)
 if mode=='dark':arr[:,:,1]=rng.integers(30,140,(24,40),dtype=np.uint8)
 if mode=='bright':arr[:,:,1]=rng.integers(205,255,(24,40),dtype=np.uint8)
 return Image.fromarray(arr).resize(size,Image.Resampling.NEAREST)
a=pattern(4,(800,480));b=pattern(13,mode='dark');c=pattern(23,mode='bright');d=pattern(42);B=np.array(b,dtype=float);C=np.array(c,dtype=float)
def saturation(arr,gain):
 y=arr[:,:,0]*.2126+arr[:,:,1]*.7152+arr[:,:,2]*.0722
 return Image.fromarray(np.clip(y[:,:,None]+gain*(arr-y[:,:,None]),0,255).astype(np.uint8))
p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size','640x360','-framerate','24','-i','pipe:0','-t','28','-c:v','libx264','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',out],stdin=subprocess.PIPE)
for n in range(672):
 t=n/24
 if t<8:
  x=round(80+25*math.sin(2*math.pi*1.1*t));y=round(60+12*math.sin(2*math.pi*.7*t));im=a.crop((x,y,x+640,y+360))
 elif t<14:im=saturation(B,1-(t-8)/6)
 elif t<20:im=saturation(C,(t-14)/6)
 else:
  im=d.copy()
  if t>=24:
   draw=ImageDraw.Draw(im);x=round(250+35*math.sin((t-24)*5));draw.rectangle((x,140,x+65,195),fill=(10,240,240))
 p.stdin.write(im.tobytes())
p.stdin.close();assert p.wait()==0
