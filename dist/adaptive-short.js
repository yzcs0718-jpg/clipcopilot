import {shortEffectTimes} from './reference-sampling.js?v=20261027motion';
import {detectTemporalEffects} from './temporal-effects.js?v=20261027motion';
import {detectDarkFlashes} from './dark-flash.js?v=20261027motion';
// Bounded refinement. Each window keeps its own regular grid.
export function planShortInspections(samples,shots,duration){
 if(!Number.isFinite(duration)||duration<=0||duration>600)throw Error('无效视频时长');
 if(duration<=4)return [{start:0,end:duration,times:shortEffectTimes(duration,0,duration,120),reason:'短视频全段补查'}];
 const frames=samples.filter(f=>Number.isFinite(f.time)&&f.pixels?.length).sort((a,b)=>a.time-b.time),candidates=[];
 for(const shot of shots.slice(1)){
  if(!Number.isFinite(shot.start)||shot.start<=0||shot.start>=duration)continue;
  let index=frames.findIndex(f=>f.time>=shot.start);if(index<1)continue;
  const a=frames[index-1].pixels,b=frames[index].pixels;if(a.length!==b.length)continue;
  let change=0;for(let j=0;j<a.length;j++)change+=Math.abs(a[j]-b[j]);change/=a.length*255;
  if(change>=.08)candidates.push({time:shot.start,score:change});
 }
 const windows=[];for(const c of candidates.sort((a,b)=>b.score-a.score||a.time-b.time)){
  const start=Math.max(0,c.time-.35),end=Math.min(duration,c.time+.35);
  if(windows.some(w=>Math.min(w.end,end)>Math.max(w.start,start)))continue;
  windows.push({start,end,times:shortEffectTimes(duration,start,end,60),reason:'候选切点附近补查'});if(windows.length===6)break;
 }return windows.sort((a,b)=>a.start-b.start);
}
export function refinedTemporalEffects(samples,windows=[]){
 let found=[...detectTemporalEffects(samples),...detectDarkFlashes(samples)];
 for(const window of windows){if(!window?.samples?.length)continue;
  const refined=[...detectTemporalEffects(window.samples),...detectDarkFlashes(window.samples)];
  found=found.filter(e=>!(e.start>=window.start&&e.end<=window.end));
  found.push(...refined.filter(e=>!found.some(old=>old.kind===e.kind&&Math.min(old.end,e.end)>Math.max(old.start,e.start))));
 }return found.sort((a,b)=>a.start-b.start);
}
