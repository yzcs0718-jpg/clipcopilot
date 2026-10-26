"""Original geometric reference with moving Chinese text and a circular texture window.
Requires Pillow, ffmpeg and NotoSansCJK font (https://github.com/notofonts/noto-cjk).
Usage: python make_spatial_fixture.py OUTPUT FONT
"""
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import subprocess,sys,math
output,font_path=sys.argv[1:3];font=ImageFont.truetype(font_path,46)
p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size','640x360','-framerate','24','-i','pipe:0','-t','6','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',output],stdin=subprocess.PIPE)
for n in range(144):
 t=n/24;x=55+18*t;im=Image.new('RGB',(640,360),(22,31,50));d=ImageDraw.Draw(im)
 for yy in range(15,355,35):
  for xx in range(15,635,35):d.rectangle((xx,yy,xx+7,yy+7),fill=(45,56,76))
 # Moving textured target, independent from the static background.
 d.rounded_rectangle((x+25,185,x+110,250),radius=8,fill=(245,139,50),outline=(255,245,160),width=3)
 for yy in range(192,245,13):
  for xx in range(0,75,13):
   if (xx//13+yy//13)%2==0:d.rectangle((x+30+xx,yy,x+38+xx,yy+8),fill=(45,52,72))
 # A different animated image, visibly bounded by a circular mask.
 tile=Image.new('RGB',(160,160));td=ImageDraw.Draw(tile)
 for j in range(-1,10):
  k=j*24+int(t*14)%24;td.rectangle((k,0,k+12,160),fill=(90,215,205));td.rectangle((k+12,0,k+24,160),fill=(235,170,75))
 mask=Image.new('L',(160,160));ImageDraw.Draw(mask).ellipse((10,10,150,150),fill=255);im.paste(tile,(440,130),mask)
 # Same content, three rendered styles: outline, colored fill and offset shadow.
 d=ImageDraw.Draw(im)
 if t<2:d.text((x,74),'剪辑节奏',font=font,fill='white',stroke_width=3,stroke_fill=(130,70,190))
 elif t<4:d.text((x,74),'剪辑节奏',font=font,fill=(255,220,60),stroke_width=3,stroke_fill=(75,35,130))
 else:
  d.text((x+5,79),'剪辑节奏',font=font,fill=(40,5,75),stroke_width=3,stroke_fill=(40,5,75));d.text((x,74),'剪辑节奏',font=font,fill=(245,245,255),stroke_width=1,stroke_fill=(120,65,190))
 p.stdin.write(im.tobytes())
p.stdin.close();assert p.wait()==0
