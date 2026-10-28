"""Original 40s continuous multi-effect fixture; detector receives only encoded pixels.
Usage: python3 tools/make_long_fixture.py output.mp4 [CJK_FONT]
Ground truth is kept here for manual QA, never passed to the detector.
"""
from PIL import Image, ImageDraw, ImageFont
import math, subprocess, sys
out=sys.argv[1]
font=ImageFont.truetype(sys.argv[2] if len(sys.argv)>2 else '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',30)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
# Shared textured landscape supports a genuine global motion fit.
base=Image.new('RGB',(800,460),(222,224,215));d=ImageDraw.Draw(base)
for j in range(72):
 x=(j*137)%800;y=(j*79)%460
 d.rectangle((x,y,x+20+j%43,y+12+j%29),fill=((j*31)%210,(j*57)%190,(j*23)%180))
for x in range(0,800,80):d.line((x,0,x+150,460),fill=(40,80,115),width=3)
p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size','640x360','-framerate','24','-i','pipe:0','-f','lavfi','-i','sine=frequency=220:duration=40','-t','40','-c:v','libx264','-crf','25','-preset','fast','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart',out],stdin=subprocess.PIPE)
for n in range(960):
 t=n/24
 # 0-8 pan; 8-16 independent movement with 1.5s freeze; 16-24 rectangular reveal;
 # 24-32 returning title motion; 32-40 global motion and fade to black.
 if t<8 or t>=32:
  u=t if t<8 else t-32;x=round(30+u*5);y=round(30+u*2)
  im=base.crop((x,y,x+640,y+360))
 else:
  local=t-8 if t<16 else t-16 if t<24 else t-24
  if t<16:
   local=2 if 10<=t<11.5 else local
   im=Image.new('RGB',(640,360),(216,222,229));dr=ImageDraw.Draw(im)
   for j in range(9):
    x=round((local*35+j*83)%740)-60;y=round(75+65*math.sin(j+local))
    dr.ellipse((x,y,x+60,y+60),fill=(35+j*11,70+j*9,110+j*9))
   dr.text((42,272),'定格，留住关键瞬间',font=font,fill=(20,30,50))
  elif t<24:
   im=Image.new('RGB',(640,360),(235,230,217));patch=base.crop((0,0,640,360))
   x=round(70+local*9);im.paste(patch.crop((x,70,x+350,270)),(x,70))
  else:
   im=Image.new('RGB',(640,360),(40,50,68));dr=ImageDraw.Draw(im)
   x=round(50+130*math.sin(local*math.pi/8));dr.text((x,145),'文字跟着节奏走',font=font,fill=(255,220,70),stroke_width=2,stroke_fill=(15,20,30))
 if t<.8:im=Image.blend(Image.new('RGB',im.size),im,t/.8)
 if t>=39.2:im=Image.blend(im,Image.new('RGB',im.size),min(1,(t-39.2)/.76))
 # All three brief overlays are inside shots, rather than actual scene changes.
 if 5.25<=t<5.375:im=Image.new('RGB',im.size,'white')
 if 14.25<=t<14.375:im=Image.new('RGB',im.size,'black')
 if 34.25<=t<34.375:im=Image.new('RGB',im.size,(0,128,255))
 p.stdin.write(im.tobytes())
p.stdin.close();assert p.wait()==0
