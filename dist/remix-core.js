// Structural remix only: no claims of semantic scene or highlight recognition.
import {validate} from './core.js';
export function remixClips(input,assets,{spread=false,mode='remix'}={}){
 if(!['remix','sequence'].includes(mode))throw Error('不支持的再创作方式');
 let clips=structuredClone(input);validate({clips},assets);
 if(mode==='sequence')return clips.sort((a,b)=>a.asset-b.asset||a.start-b.start);
 if(spread){
  for(let asset=0;asset<assets.length;asset++){
   const list=clips.filter(c=>c.asset===asset),used=list.reduce((n,c)=>n+c.end-c.start,0),slack=Math.max(0,assets[asset].duration-used);let cursor=0;
   for(let i=0;i<list.length;i++){const c=list[i],duration=c.end-c.start;const gap=list.length>1?slack*i/(list.length-1):slack/2;c.start=cursor+gap;c.end=c.start+duration;cursor+=duration;}
  }
 }
 // Arrange in source order, then move a later shot forward as a cold open.
 // In quality mode prefer a scored later shot; its score is image quality, not story importance.
 const ordered=clips.sort((a,b)=>a.asset-b.asset||a.start-b.start);
 if(ordered.length>1){const candidates=ordered.map((c,i)=>({c,i})).filter(x=>x.i>0);const scored=candidates.filter(x=>Number.isFinite(x.c.quality?.score));const hook=scored.length?scored.sort((a,b)=>b.c.quality.score-a.c.quality.score||b.c.start-a.c.start)[0].i:Math.max(1,Math.floor(ordered.length*.65));const [first]=ordered.splice(hook,1);ordered.unshift(first);}
 if(mode==='remix'&&new Set(ordered.map(c=>c.asset)).size>1){const count=ordered.length,mixed=[ordered.shift()],queues=new Map();for(const c of ordered){if(!queues.has(c.asset))queues.set(c.asset,[]);queues.get(c.asset).push(c)}while(mixed.length<count){const choices=[...queues].filter(([,q])=>q.length).sort((a,b)=>b[1].length-a[1].length||a[0]-b[0]);const selected=choices.find(([asset])=>asset!==mixed.at(-1).asset)||choices[0];mixed.push(selected[1].shift())}return validate({clips:mixed},assets).clips;}
 return validate({clips:ordered},assets).clips;
}
export function storyboardCopy(clips,copy){
 const result=structuredClone(clips);result.forEach(c=>c.caption='');
 const indices=[0,Math.floor(result.length/3),Math.floor(result.length*2/3),result.length-1];
 // Assign once per section; avoid showing the same closing sentence on every shot.
 for(let i=0;i<indices.length;i++){const at=indices[i];if(i===3||!result[at].caption)result[at].caption=copy[i]||'';}
 return result;
}
export function remixReport(plan,assets){
 const clips=plan.clips||[],original=assets.reduce((n,a)=>n+a.duration,0),duration=clips.reduce((n,c)=>n+Math.max(0,c.end-c.start),0);let cursor=0;
 const rows=clips.map((c,i)=>{const start=cursor;cursor+=Math.max(0,c.end-c.start);return {number:i+1,outputStart:start,outputEnd:cursor,asset:c.asset,sourceStart:c.start,sourceEnd:c.end,effect:c.effect||'none',caption:c.caption}});
 const chronological=[...clips].sort((a,b)=>a.asset-b.asset||a.start-b.start);const reordered=clips.filter((c,i)=>c!==chronological[i]).length;
 const coverage=assets.reduce((sum,a,asset)=>{const ranges=clips.filter(c=>c.asset===asset).sort((a,b)=>a.start-b.start);let end=0;for(const c of ranges){sum+=Math.max(0,c.end-Math.max(end,c.start));end=Math.max(end,c.end)}return sum},0);
 const removed=Math.max(0,original-coverage),limited=clips.length<2;
 const usedAssets=new Set(clips.map(c=>c.asset)),unused=assets.map((a,i)=>({name:a.name||`素材 ${i+1}`,asset:i})).filter(a=>!usedAssets.has(a.asset));
 return {original,duration,removed,reordered,rows,limited,usedAssets:usedAssets.size,unused,summary:`已使用 ${usedAssets.size}/${assets.length} 条视频。${unused.length?'仍有 '+unused.length+' 条未入选，可增加目标时长后重新混剪。':''}原素材 ${original.toFixed(1)} 秒 → 成片 ${duration.toFixed(1)} 秒；舍去 ${removed.toFixed(1)} 秒；${reordered} 段改变播放位置。${limited?'素材或目标时长不足以重组多个镜头，变化有限。':reordered?'已把后段镜头前置，再接回过程段落。':'保留原片顺序，主要调整选段、字幕与效果。'}`};
}
