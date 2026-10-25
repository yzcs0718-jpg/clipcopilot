import argparse,json,math,subprocess,tempfile
from pathlib import Path

def run(args,cwd=None):
    return subprocess.run(args,check=True,capture_output=True,text=True,cwd=cwd).stdout

def render(plan,output,inputs,ratio,burn_captions=False):
    sizes={'9:16':(720,1280),'16:9':(1280,720),'1:1':(720,720)}
    w,h=sizes[ratio];clips=plan.get('clips')
    if not isinstance(clips,list) or not 1<=len(clips)<=100: raise ValueError('Expected 1–100 clips')
    probes=[json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(Path(x).resolve())])) for x in inputs]
    for c in clips:
        i=c['asset'];start=c['start'];end=c['end']
        if isinstance(i,bool) or not isinstance(i,int) or i<0 or i>=len(inputs):raise ValueError('Invalid asset')
        if not all(isinstance(t,(int,float)) and math.isfinite(t) for t in [start,end]) or start<0 or end<=start or end>float(probes[i]['format']['duration'])+.01:raise ValueError('Invalid time range')
        if c.get('effect','none') not in ['none','push','fade']:raise ValueError('Invalid effect')
        if not isinstance(c.get('caption',''),str) or len(c.get('caption',''))>200:raise ValueError('Invalid caption')
    output=Path(output).resolve()
    if output.exists() or output.with_suffix('.srt').exists():raise ValueError('Output or matching SRT already exists; choose a new filename')
    output.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        files=[]
        for n,c in enumerate(clips):
            i=c['asset'];f=Path(tmp)/f'{n:03}.mp4';duration=c['end']-c['start'];cmd=['ffmpeg','-v','error','-nostdin','-ss',str(c['start']),'-i',str(Path(inputs[i]).resolve())]
            has_audio=any(x['codec_type']=='audio' for x in probes[i]['streams'])
            if not has_audio:cmd+=['-f','lavfi','-i','anullsrc=r=48000:cl=stereo']
            vf=f'scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30'
            if c.get('effect')=='push':vf+=f",zoompan=z='1+0.08*on/{max(1,round(duration*30)-1)}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s={w}x{h}:fps=30"
            elif c.get('effect')=='fade':
                fade=min(.3,duration/2);vf+=f',fade=t=in:st=0:d={fade},fade=t=out:st={max(0,duration-fade)}:d={fade}'
            if burn_captions and c.get('caption'):
                ms=round(duration*1000);end_ts=f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
                sub=Path(tmp)/f'caption-{n}.srt';sub.write_text('1\n00:00:00,000 --> '+end_ts+'\n'+c['caption']+'\n',encoding='utf-8');vf+=f',subtitles=filename={sub.name}'
            cmd+=['-t',str(duration),'-map','0:v:0','-map','0:a:0' if has_audio else '1:a:0','-vf',vf,'-c:v','libx264','-preset','fast','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-ac','2',str(f)]
            run(cmd,cwd=tmp);files.append(f)
        listing=Path(tmp)/'concat.txt';listing.write_text(''.join("file '"+str(f)+"'\n" for f in files))
        run(['ffmpeg','-v','error','-nostdin','-f','concat','-safe','0','-i',str(listing),'-c','copy','-movflags','+faststart',str(output)])
    def ts(t):
        n=round(t*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}'
    timeline=0;subs=[]
    for n,c in enumerate(clips):
        end=timeline+c['end']-c['start'];subs.append(f"{n+1}\n{ts(timeline)} --> {ts(end)}\n{c.get('caption','')}\n");timeline=end
    output.with_suffix('.srt').write_text('\n'.join(subs),encoding='utf-8')
    print(json.dumps({'output':str(output),'probe':json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(output)]))},ensure_ascii=False))

if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('plan');a.add_argument('output');a.add_argument('inputs',nargs='+');a.add_argument('--burn-captions',action='store_true');a.add_argument('--ratio',choices=['9:16','16:9','1:1'],default='9:16');args=a.parse_args();render(json.loads(Path(args.plan).read_text()),args.output,args.inputs,args.ratio,args.burn_captions)
