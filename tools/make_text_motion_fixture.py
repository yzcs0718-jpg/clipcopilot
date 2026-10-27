"""Original return-to-start caption animation using our existing rendered text.
Uses no reference labels inside the detection pipeline and requires no font download.
"""
from pathlib import Path
from PIL import Image
import subprocess,io,math
root=Path(__file__).resolve().parents[1]
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(root/'dist/demo/spatial-fixture.mp4'),'-frames:v','1','-f','image2pipe','-vcodec','png','pipe:1'])
tile=Image.open(io.BytesIO(raw)).convert('RGBA').crop((40,70,280,145))
alpha=Image.new('L',tile.size);alpha.putdata([255 if max(pixel[:3])>105 else 0 for pixel in tile.getdata()]);tile.putalpha(alpha);tile=tile.crop(alpha.getbbox())
p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size','640x360','-framerate','24','-i','pipe:0','-t','4','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(root/'dist/demo/text-motion-fixture.mp4')],stdin=subprocess.PIPE)
for frame in range(96):
 time=frame/24;wave=math.sin(math.pi*time/4);scale=1+.5*wave;word=tile.resize((round(tile.width*scale),round(tile.height*scale)),Image.Resampling.LANCZOS);image=Image.new('RGB',(640,360),(22,31,50));cx=(.3+.35*wave)*640;cy=.48*360;image.paste(word,(round(cx-word.width/2),round(cy-word.height/2)),word);p.stdin.write(image.tobytes())
p.stdin.close();assert p.wait()==0
