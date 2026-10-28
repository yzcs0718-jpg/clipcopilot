// Only show decoded reference frames; never label a nearest frame as the requested time.
export function lessonFrames(item,samples){
 const frames=[...new Map(samples.map(f=>[f.time,f])).values()].filter(f=>Number.isFinite(f.time)&&typeof f.image==='string'&&f.image).sort((a,b)=>a.time-b.time);
 if(!frames.length||!Number.isFinite(item.start)||!Number.isFinite(item.end))return[];
 const inside=frames.filter(f=>f.time>=item.start&&f.time<=item.end);
 const before=frames.filter(f=>f.time<item.start).at(-1)||frames[0];
 const after=frames.find(f=>f.time>item.end)||frames.at(-1);
 const peak=item.preview?.peakStart;
 const target=Number.isFinite(peak)?peak:(item.start+item.end)/2;
 const middle=(inside.length?inside:frames).reduce((a,b)=>Math.abs(b.time-target)<Math.abs(a.time-target)?b:a);
 const seen=new Set();return[{label:'效果前参考',frame:before},{label:'效果区间参考',frame:middle},{label:'效果后参考',frame:after}].filter(x=>{if(seen.has(x.frame.time))return false;seen.add(x.frame.time);return true});
}
