import {detectColorFlashes} from './color-flash.js?v=20261027motion';
import {shortEffectTimes} from './reference-sampling.js?v=20261027motion';
import {detectTemporalEffects} from './temporal-effects.js?v=20261028long3';
import {detectDarkFlashes} from './dark-flash.js?v=20261027motion';
// Bounded refinement. Each window keeps its own regular grid.
export function planShortInspections(samples,shots,duration){
 if(!Number.isFinite(duration)||duration<=0||duration>600)throw Error('无效视频时长');
 if(duration<=4)return [{start:0,end:duration,times:shortEffectTimes(duration,0,duration,120),reason:'短视频全段补查'}];
 const frames=samples.filter(f=>Number.isFinite(f.time)&&f.pixels?.length).sort((a,b)=>a.time-b.time),candidates=[];
 // Inspect actual changes even when segmentation suppresses a short event.
 // Selecting only shot starts missed flashes inside the 0.8s minimum shot gap.
 for(let index=1;index<frames.length;index++){
  const time=frames[index].time;if(time<=0||time>=duration||time-frames[index-1].time>1.1)continue;
  const a=frames[index-1].pixels,b=frames[index].pixels;if(a.length!==b.length)continue;
  let change=0;for(let j=0;j<a.length;j++)change+=Math.abs(a[j]-b[j]);change/=a.length*255;
  if(change>=.08)candidates.push({time,score:change});
 }
 // First cover the strongest change in each sixth of the timeline; then fill
 // spare slots by score. This avoids spending every window on an early burst.
 const ranked=candidates.sort((a,b)=>b.score-a.score||a.time-b.time),regions=new Set(),spread=[];
 for(const c of ranked){const region=Math.min(5,Math.floor(c.time/duration*6));if(!regions.has(region)){regions.add(region);spread.push(c)}}
 const windows=[];for(const c of [...spread,...ranked]){
  const start=Math.max(0,c.time-.35),end=Math.min(duration,c.time+.35);
  if(windows.some(w=>Math.min(w.end,end)>Math.max(w.start,start)))continue;
  windows.push({start,end,times:shortEffectTimes(duration,start,end,60),reason:'实测画面突变附近补查'});if(windows.length===6)break;
 }return windows.sort((a,b)=>a.start-b.start);
}
export function refinedTemporalEffects(samples,windows=[]){
 let found=[...detectTemporalEffects(samples),...detectDarkFlashes(samples),...detectColorFlashes(samples)];
 for(const window of windows){if(!window?.samples?.length)continue;
  const refined=[...detectTemporalEffects(window.samples),...detectDarkFlashes(window.samples),...detectColorFlashes(window.samples)];
  found=found.filter(e=>!(e.start>=window.start&&e.end<=window.end));
  found.push(...refined.filter(e=>!found.some(old=>old.kind===e.kind&&Math.min(old.end,e.end)>Math.max(old.start,e.start))));
 }return found.sort((a,b)=>a.start-b.start);
}
