"""Original 10s rectangle reference: solid negative, static negative, moving positive, blank.
No third-party assets or model answers are embedded in the detection pipeline.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import subprocess
root=Path(__file__).resolve().parents[1]
output=root/'dist/demo/rectangle-fixture.mp4'
p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size','640x360','-framerate','24','-i','pipe:0','-t','10','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(output)],stdin=subprocess.PIPE)
for n in range(240):
 t=n/24;im=Image.new('RGB',(640,360),(20,25,40));d=ImageDraw.Draw(im)
 if t<8:
  left=80 if t<4 else 352;top=104;width=192;height=160
  tile=Image.new('RGB',(width,height),(60,215,175));td=ImageDraw.Draw(tile)
  if t>=2:
   phase=0 if t<4 else int((t-4)*18)%32
   for xx in range(-32,width+32,32):td.rectangle((xx+phase,0,xx+phase+15,height),fill=(220,90,50))
  im.paste(tile,(left,top))
 p.stdin.write(im.tobytes())
p.stdin.close();assert p.wait()==0
