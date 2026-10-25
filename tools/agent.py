"""ClipPilot local staged agent: inspect -> plan -> validate -> render -> review."""
import argparse,contextlib,io,json,math,os,sys,time,urllib.request
from pathlib import Path
from render import render,run


def validate(plan,assets):
    clips=plan.get('clips')
    if not isinstance(clips,list) or not 1<=len(clips)<=100:raise ValueError('Expected 1–100 clips')
    for c in clips:
        i=c.get('asset');start=c.get('start');end=c.get('end')
        if isinstance(i,bool) or not isinstance(i,int) or not 0<=i<len(assets):raise ValueError('Invalid asset index')
        if any(isinstance(t,bool) or not isinstance(t,(int,float)) or not math.isfinite(t) for t in [start,end]) or not 0<=start<end<=assets[i]['duration']+.01:raise ValueError('Invalid timeline range')
        if c.get('effect','none') not in ['none','push','fade']:raise ValueError('Invalid effect')
        if not isinstance(c.get('caption',''),str) or len(c.get('caption',''))>200:raise ValueError('Invalid caption')
    return plan


def execute(inputs,output,ratio='9:16',seconds=5,plan_path=None,script_path=None,api=None,brief='',burn=False):
    output=Path(output).resolve()
    targets=[output,output.with_suffix('.srt'),output.with_suffix('.plan.json'),output.with_suffix('.agent.json')]
    if any(p.exists() for p in targets):raise ValueError('Output or sidecar already exists; select another output path')
    if not 1<=seconds<=60:raise ValueError('Seconds must be between 1 and 60')
    if not 1<=len(inputs)<=100:raise ValueError('Expected 1–100 source files')
    inputs=[str(Path(p).resolve()) for p in inputs]
    trace=[]
    def stage(name,**data):trace.append({'stage':name,**data})
    assets=[]
    for path in inputs:
        probe=json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',path]))
        if not any(s.get('codec_type')=='video' for s in probe['streams']):raise ValueError('Video stream required')
        duration=float(probe['format']['duration'])
        if not math.isfinite(duration) or not 0<duration<=86400:raise ValueError('Invalid source duration')
        assets.append({'name':Path(path).name,'duration':duration})
    stage('inspect',assets=assets)
    if plan_path:
        plan=json.loads(Path(plan_path).read_text(encoding='utf-8'));mode='approved-plan'
    elif api:
        from urllib.parse import urlparse
        parsed=urlparse(api)
        if parsed.scheme!='https' and not (parsed.scheme=='http' and parsed.hostname in ['localhost','127.0.0.1']):raise ValueError('Use HTTPS for remote API')
        token=os.environ.get('APP_TOKEN','')
        if len(token)<24:raise ValueError('Set APP_TOKEN in the environment')
        request=urllib.request.Request(api.rstrip('/')+'/api/plan',json.dumps({'brief':brief,'assets':assets},ensure_ascii=False).encode(),{'Content-Type':'application/json','Authorization':'Bearer '+token})
        with urllib.request.urlopen(request,timeout=70) as response:plan=json.load(response)
        mode='api-planned'
    elif script_path:
        lines=[s.strip() for s in Path(script_path).read_text(encoding='utf-8').splitlines() if s.strip() and not s.lstrip().startswith('#')]
        if not 1<=len(lines)<=100:raise ValueError('Script needs 1–100 non-heading lines')
        used=[0.0]*len(assets);next_asset=0;clips=[]
        for caption in lines:
            found=None
            for j in range(len(assets)):
                i=(next_asset+j)%len(assets)
                if assets[i]['duration']-used[i]>.1:found=i;break
            if found is None:raise ValueError('Not enough footage for script; shorten seconds or provide more footage')
            i=found;end=min(assets[i]['duration'],used[i]+seconds);clips.append({'asset':i,'start':used[i],'end':end,'caption':caption});used[i]=end;next_asset=(i+1)%len(assets)
        plan={'clips':clips};mode='local-script'
    else:
        plan={'clips':[{'asset':i,'start':0,'end':min(seconds,a['duration']),'caption':''} for i,a in enumerate(assets)]};mode='local-draft'
    stage('planner',mode=mode)
    validate(plan,assets);stage('validator',clips=len(plan['clips']))
    output.parent.mkdir(parents=True,exist_ok=True)
    plan_file=output.with_suffix('.plan.json');plan_file.write_text(json.dumps({**plan,'ratio':ratio,'assets':assets},ensure_ascii=False,indent=2),encoding='utf-8')
    with contextlib.redirect_stdout(io.StringIO()):render(plan,str(output),inputs,ratio,burn)
    stage('renderer',format='mp4',burned_captions=burn)
    probe=json.loads(run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(output)]));video=next(s for s in probe['streams'] if s['codec_type']=='video')
    expected=sum(c['end']-c['start'] for c in plan['clips']);actual=float(probe['format']['duration']);size={'9:16':(720,1280),'16:9':(1280,720),'1:1':(720,720)}[ratio]
    verified=(video['width'],video['height'])==size and abs(actual-expected)<=max(.3,.08*len(plan['clips'])) and any(s['codec_type']=='audio' for s in probe['streams'])
    stage('reviewer',passed=verified,width=video['width'],height=video['height'],expected_seconds=expected,actual_seconds=actual,note='Structural media checks only; not a creative or visual judgment')
    result={'success':verified,'mode':mode,'output':str(output),'plan':str(plan_file),'subtitles':str(output.with_suffix('.srt')),'trace':trace}
    output.with_suffix('.agent.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    if not verified:raise ValueError('Output created, but structural review failed; inspect the .agent.json report')
    return result


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('inputs',nargs='+');p.add_argument('--output',required=True);p.add_argument('--ratio',choices=['9:16','16:9','1:1'],default='9:16');p.add_argument('--seconds',type=float,default=5)
    mode=p.add_mutually_exclusive_group();mode.add_argument('--plan');mode.add_argument('--script');mode.add_argument('--api');p.add_argument('--brief',default='Create a concise video edit from the supplied metadata');p.add_argument('--burn-captions',action='store_true');a=p.parse_args()
    try:print(json.dumps(execute(a.inputs,a.output,a.ratio,a.seconds,a.plan,a.script,a.api,a.brief,a.burn_captions),ensure_ascii=False))
    except Exception as e:print(json.dumps({'success':False,'error':str(e)},ensure_ascii=False),file=sys.stderr);raise SystemExit(1)
if __name__=='__main__':main()
