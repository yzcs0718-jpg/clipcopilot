// OCR observations are image evidence, never an assertion of an editor preset.
export function textSampleTimes(duration,max=120){
 if(!Number.isFinite(duration)||duration<=0||duration>600)throw Error('视频时长必须在 0–600 秒内');
 const count=Math.min(max,Math.max(1,Math.ceil(duration)));return Array.from({length:count},(_,i)=>Math.min(duration-.001,(i+.5)*duration/count));
}
export function extractTextLines(data,width,height,time){
 if(!width||!height||!Number.isFinite(time))return [];
 const lines=(data.blocks||[]).flatMap(b=>(b.paragraphs||[]).flatMap(p=>p.lines||[]));
 return lines.map(line=>{const text=String(line.text||'').replace(/\s+/g,' ').trim().slice(0,300),box=line.bbox,conf=Number.isFinite(line.confidence)?line.confidence:line.words?.length?line.words.reduce((s,w)=>s+(w.confidence||0),0)/line.words.length:data.confidence;return{text,confidence:conf,time,box:box?{x:box.x0/width,y:box.y0/height,w:(box.x1-box.x0)/width,h:(box.y1-box.y0)/height}:null}}).filter(x=>(x.text.match(/[\p{L}\p{N}]/gu)||[]).length>=2&&(/[\u3400-\u9fff]/u.test(x.text)||/^[A-Z0-9]{2}$/.test(x.text)||(x.text.match(/[\p{L}\p{N}]/gu)||[]).length>=3)&&x.confidence>=55&&x.box&&Object.values(x.box).every(Number.isFinite)&&x.box.w>0&&x.box.h>0&&x.box.x>=0&&x.box.y>=0&&x.box.x+x.box.w<=1.01&&x.box.y+x.box.h<=1.01).slice(0,16);
}
const key=s=>s.toLocaleLowerCase().replace(/[\s\p{P}\p{S}]/gu,'');
export function buildTextTracks(frames,step){
 const tracks=[];for(const f of [...frames].sort((a,b)=>a.time-b.time)){for(const item of f.lines||[]){const match=tracks.filter(t=>key(t.text)===key(item.text)&&item.time>t.end&&item.time-t.end<=step*1.6).sort((a,b)=>Math.hypot(a.last.box.x-item.box.x,a.last.box.y-item.box.y)-Math.hypot(b.last.box.x-item.box.x,b.last.box.y-item.box.y))[0];if(match){match.end=item.time;match.last=item;match.observations.push(item)}else tracks.push({text:item.text,start:item.time,end:item.time,first:item,last:item,observations:[item]})}}
 return tracks.map(t=>{const a=t.first.box,b=t.last.box;return{...t,moving:t.observations.length>=2&&Math.hypot(b.x-a.x,b.y-a.y)>.035,scaling:t.observations.length>=2&&Math.abs(b.w/a.w-1)>.2}});
}
export function textSteps(track){const a=track.first.box,b=track.last.box,steps=[`文本 → 新建文本，输入“${track.text}”，先校正 OCR 错字。`,`将文字框中心放到画面横向 ${Math.round((a.x+a.w/2)*100)}%、纵向 ${Math.round((a.y+a.h/2)*100)}% 处；文字框约占画面宽度 ${Math.round(a.w*100)}%。字体、描边、阴影需要对照原片选择。`];if(track.moving)steps.push(`在 ${track.start.toFixed(2)} 秒添加位置关键帧，在 ${track.end.toFixed(2)} 秒移到横向 ${Math.round((b.x+b.w/2)*100)}%、纵向 ${Math.round((b.y+b.h/2)*100)}%；这是位置变化的试做方案，实景文字与运镜也会产生相似证据。`);if(track.scaling)steps.push(`同一文字框采样宽度变为约 ${Math.round(b.w/a.w*100)}%，可在首尾试加缩放关键帧；OCR 框抖动、透视和遮挡也可能造成宽度变化。`);steps.push(`仅在 ${track.start.toFixed(2)}–${track.end.toFixed(2)} 秒采样中见到文字，不代表准确入出点；逐帧校准文本轨两端和动画曲线。无法据此判断打字机、蒙版或跟踪预设。`);return steps}
export function textEvidenceReport(data){return ['## 画面文字识别与位置线索（OCR 候选）',`采样 ${data.frames.length} 帧，间隔约 ${data.step.toFixed(2)} 秒；置信分数不是准确率。中文自检尚未通过。文字可能来自字幕、招牌或水印。短暂动画、花字、小字可能漏掉。`,...data.tracks.map(t=>`${t.start.toFixed(2)}–${t.end.toFixed(2)} 秒：${t.text}\n${textSteps(t).join('\n')}`),data.tracks.length?'':'未获得可靠文字，不能认定没有字幕。'].join('\n\n')}
