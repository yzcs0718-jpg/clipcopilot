import {remixClips,storyboardCopy} from './remix-core.js?v=20261027review';
import {creativePlan} from './creative-core.js?v=20261027review';
import {validate} from './core.js?v=20261027review';
export function frameQuality(rgba,width,height){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||rgba.length!==width*height*4)throw Error('采样像素格式无效');
 const luma=new Float64Array(width*height);let sum=0,square=0,clipped=0,edges=0;
 for(let i=0;i<luma.length;i++){const p=i*4,v=(.2126*rgba[p]+.7152*rgba[p+1]+.0722*rgba[p+2])/255;luma[i]=v;sum+=v;square+=v*v;if(v<.025||v>.975)clipped++}
 const brightness=sum/luma.length,contrast=Math.sqrt(Math.max(0,square/luma.length-brightness**2));
 for(let y=0;y<height-1;y++)for(let x=0;x<width-1;x++){const i=y*width+x;edges+=Math.abs(luma[i]-luma[i+1])+Math.abs(luma[i]-luma[i+width])}
 const detail=edges/((width-1)*(height-1)*2),exposure=Math.max(0,1-Math.abs(brightness-.5)*2),score=Math.max(0,Math.min(1,.45*exposure+.3*Math.min(1,contrast/.22)+.25*Math.min(1,detail/.12)-.3*clipped/luma.length));
 const flags=[];if(brightness<.08)flags.push('偏暗 / 黑场候选');if(brightness>.92)flags.push('偏亮 / 过曝候选');if(contrast<.025)flags.push('画面变化少或纯色');
 return {score,brightness,contrast,detail,flags};
}
export function qualityWindows(samples,duration,window=6){
 if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(window)||window<.5||!Array.isArray(samples)||!samples.length)throw Error('缺少有效画面采样');
 const length=Math.min(window,duration),candidates=samples.map(s=>{if(!Number.isFinite(s.time)||s.time<0||s.time>duration||!Number.isFinite(s.score)||s.score<0||s.score>1)throw Error('画面评分无效');const start=Math.max(0,Math.min(duration-length,s.time-length/2));return {start,end:start+length,score:s.score,flags:s.flags||[],sampleTime:s.time}}).sort((a,b)=>b.score-a.score||a.start-b.start),chosen=[];
 for(const c of candidates){if(chosen.every(p=>c.end<=p.start+.001||c.start>=p.end-.001))chosen.push(c)}
 return chosen;
}
export function qualityPlan(assets,analyses,options={}){
 if(assets.length!==analyses.length||!assets.length)throw Error('素材与画面检查不匹配');
 const queues=analyses.map((samples,asset)=>qualityWindows(samples,assets[asset].duration).map(w=>({...w,asset}))),windows=[];
 // Cover each source before adding further windows from a high-scoring source.
 let capacity=0;for(let round=0;windows.length<100;round++){let added=false;for(const q of queues){if(q[round]){windows.push(q[round]);capacity+=q[round].end-q[round].start;added=true;if(windows.length>=100)break}}if(!added||capacity>=(options.target||15))break;}
 const result=creativePlan(windows.map(w=>({duration:w.end-w.start})),{...options,deferRemix:true});
 const choices=result.clips.map(c=>{const w=windows[c.asset];return {asset:w.asset,start:c.start+w.start,end:c.end+w.start,caption:c.caption,effect:c.effect,quality:{score:w.score,sampleTime:w.sampleTime,flags:w.flags}}});
 const edited=storyboardCopy(options.style==='reference'?choices:remixClips(choices,assets,{mode:options.mode||'remix'}),result.copy.split('\n'));
 return {...result,...validate({clips:edited},assets),quality:edited.map(c=>({asset:c.asset,start:c.start,end:c.end,...c.quality})),truncated:result.actual<result.requested-.1};
}
