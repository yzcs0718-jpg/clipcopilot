import{textMotion}from './text-motion.js?v=20261027motion';
// OCR observations are image evidence, never an assertion of an editor preset.
export function textSampleTimes(duration,max=120,shots=[]){
 if(!Number.isFinite(duration)||duration<=0||duration>600)throw Error('视频时长必须在 0–600 秒内');
 if(!Number.isInteger(max)||max<1||max>240)throw Error('无效 OCR 采样上限');
 const count=Math.min(max,120,Math.max(1,Math.ceil(duration))),base=Array.from({length:count},(_,i)=>Math.min(duration-.001,(i+.5)*duration/count));
 const hints=shots.slice(0,100).flatMap(s=>[s.start,s.end]).filter(t=>Number.isFinite(t)&&t>0&&t<duration).flatMap(t=>[-.2,-.1,0,.1,.2].map(d=>Math.max(0,Math.min(duration-.001,t+d))));
 const result=[...base];for(const time of hints){if(result.length>=max)break;if(!result.some(t=>Math.abs(t-time)<.025))result.push(time)}return result.sort((a,b)=>a-b);
}
export function extractTextLines(data,width,height,time){
 if(!width||!height||!Number.isFinite(time))return [];
 const lines=(data.blocks||[]).flatMap(b=>(b.paragraphs||[]).flatMap(p=>p.lines||[]));
 return lines.map(line=>{const text=String(line.text||'').replace(/\s+/g,' ').trim().slice(0,300),box=line.bbox,conf=Number.isFinite(line.confidence)?line.confidence:line.words?.length?line.words.reduce((s,w)=>s+(w.confidence||0),0)/line.words.length:data.confidence;return{text,confidence:conf,time,box:box?{x:box.x0/width,y:box.y0/height,w:(box.x1-box.x0)/width,h:(box.y1-box.y0)/height}:null}}).filter(x=>(x.text.match(/[\p{L}\p{N}]/gu)||[]).length>=2&&(/[\u3400-\u9fff]/u.test(x.text)||/^[A-Z0-9]{2}$/.test(x.text)||(x.text.match(/[\p{L}\p{N}]/gu)||[]).length>=3)&&x.confidence>=55&&x.box&&Object.values(x.box).every(Number.isFinite)&&x.box.w>0&&x.box.h>0&&x.box.x>=0&&x.box.y>=0&&x.box.x+x.box.w<=1.01&&x.box.y+x.box.h<=1.01).slice(0,16);
}
const key=s=>s.toLocaleLowerCase().replace(/[\s\p{P}\p{S}]/gu,'');
export function buildTextTracks(frames,step){
 const tracks=[];for(const f of [...frames].sort((a,b)=>a.time-b.time)){for(const original of f.lines||[]){const item={...original,sampleStep:f.sampleStep||step};const match=tracks.filter(t=>key(t.text)===key(item.text)&&item.time>t.end&&item.time-t.end<=Math.max(item.sampleStep,t.last.sampleStep||step)*1.6).sort((a,b)=>Math.hypot(a.last.box.x-item.box.x,a.last.box.y-item.box.y)-Math.hypot(b.last.box.x-item.box.x,b.last.box.y-item.box.y))[0];if(match){match.end=item.time;match.last=item;match.observations.push(item)}else tracks.push({text:item.text,start:item.time,end:item.time,first:item,last:item,observations:[item]})}}
 return tracks.map(t=>({...t,...textMotion(t.observations)}));
}
export function textSteps(track){const a=track.first.box,b=track.last.box,steps=[`文本 → 新建文本，输入“${track.text}”，先校正 OCR 错字。`,`将文字框中心放到画面横向 ${Math.round((a.x+a.w/2)*100)}%、纵向 ${Math.round((a.y+a.h/2)*100)}% 处；文字框约占画面宽度 ${Math.round(a.w*100)}%。字体、描边、阴影需要对照原片选择。`];const styles=[];for(const o of track.observations||[]){if(!o.style)continue;const bin=h=>h?[1,3,5].map(i=>Math.floor(parseInt(h.slice(i,i+2),16)/48)).join('-'):'';const key=bin(o.style.fill)+' '+bin(o.style.edge)+' '+o.style.type;if(styles.every(s=>s.key!==key))styles.push({key,time:o.time,...o.style});if(styles.length>=3)break}for(const style of styles)steps.push(`${style.time.toFixed(2)} 秒色采样：文字区域 ${style.fill}${style.edge?'，邻近边缘 '+style.edge+'（'+(style.type==='outline-candidate'?'描边线索':'阴影或描边线索')+'）':''}。剪映 → 文本 → 样式，核对两色的填充/边缘分工；字体与原参数未知。`);const motion=track.keyframes?track:textMotion(track.observations||[track.first,track.last]);if(motion.moving||motion.scaling){steps.push(`全程几何线索：${[motion.positionPattern,motion.scalePattern].filter(Boolean).join('；')}。实景文字、运镜、透视、遮挡和 OCR 框抖动也可能造成变化，不证明使用了某个动画预设。`);steps.push('剪映 → 文本 → 基础属性：在以下时间依次试加位置/缩放关键帧。缩放以本轨首个采样文字框宽度为 100%，不是恢复原字号；节点间先用线性过渡，原曲线未知。');for(const p of motion.keyframes)steps.push(`${p.time.toFixed(2)} 秒：文字中心试放横向 ${Math.round(p.x*100)}%、纵向 ${Math.round(p.y*100)}%${motion.scaling?'；缩放试用 '+Math.round(p.scale*100)+'%':''}。`)}steps.push(`仅在 ${track.start.toFixed(2)}–${track.end.toFixed(2)} 秒采样中见到文字，不代表准确入出点；逐帧校准文本轨两端和动画曲线。无法据此判断打字机、蒙版或跟踪预设。`);return steps}
export function textEvidenceReport(data){return ['## 画面文字识别与位置线索（OCR 候选）',`采样 ${data.frames.length} 帧，基础间隔约 ${data.step.toFixed(2)} 秒；各帧真实时间见采样证据；${data.partial?`基础检查部分完成 ${data.completedFrames}/${data.plannedFrames} 个计划采样点，其余时间未知。`:data.fullScan===false?'仅分析区间 '+data.coverage.map(r=>r.start.toFixed(2)+'–'+r.end.toFixed(2)+' 秒').join('；')+'，其余时间未知。':'基础采样覆盖全片。'}${data.denseRanges?.length?'6 帧/秒精查区间：'+data.denseRanges.map(r=>r.start.toFixed(2)+'–'+r.end.toFixed(2)+' 秒').join('；')+'。':''}置信分数不是准确率。PaddleOCR 输出需核对，中文花字与特殊字体可能误识别。文字可能来自字幕、招牌或水印。短暂动画、花字、小字可能漏掉。`,...data.tracks.map(t=>`${t.start.toFixed(2)}–${t.end.toFixed(2)} 秒：${t.text}\n${textSteps(t).join('\n')}`),data.tracks.length?'':'未获得可靠文字，不能认定没有字幕。'].join('\n\n')}

export function denseTextSampleTimes(duration,start,end){if(!Number.isFinite(duration)||duration<=0||duration>600||!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>duration||end<=start||end-start>10)throw Error('精查区间必须在视频内，且每次不超过 10 秒');const count=Math.max(1,Math.ceil((end-start)*6));return Array.from({length:count},(_,i)=>start+(i+.5)*(end-start)/count)}
function mergeRanges(ranges){const result=[];for(const range of ranges.map(r=>({...r})).sort((a,b)=>a.start-b.start)){const last=result.at(-1);if(last&&range.start<=last.end+.001)last.end=Math.max(last.end,range.end);else result.push(range)}return result}
export function mergeTextEvidence(previous,current){if(current.fullScan||!previous){const data={...current,coverage:[current.scope],denseRanges:current.fullScan?[]:[current.scope]};return{...data,tracks:buildTextTracks(data.frames,data.step)}}const frames=[...previous.frames.filter(f=>f.time<current.scope.start||f.time>=current.scope.end),...current.frames].sort((a,b)=>a.time-b.time),step=previous.step;if(frames.length>240)throw Error('累计文字采样超过 240 帧');return{...current,step,frames,fullScan:previous.fullScan,coverage:mergeRanges([...previous.coverage,current.scope]),denseRanges:mergeRanges([...previous.denseRanges,current.scope]),tracks:buildTextTracks(frames,step)}}

// A checkpoint describes successful sampled instants, never an analyzed interval.
export function partialTextEvidence({frames,times,step,scope,source}){
 if(!Array.isArray(times)||times.length>240||!times.length||!Array.isArray(frames)||!Number.isFinite(step)||step<=0||!scope||!Number.isFinite(scope.start)||!Number.isFinite(scope.end)||scope.end<=scope.start||times.some((t,i)=>!Number.isFinite(t)||t<scope.start||t>=scope.end||i>0&&t<=times[i-1]))throw Error('无效文字检查进度');
 const sorted=[...frames].sort((a,b)=>a.time-b.time);
 if(sorted.some((f,i)=>!Number.isFinite(f.time)||!times.some(t=>Math.abs(t-f.time)<1e-6)||i>0&&Math.abs(f.time-sorted[i-1].time)<1e-6))throw Error('文字进度包含重复或未计划的采样');
 if(!sorted.length)return null;
 return{frames:sorted,step,scope,source,partial:true,fullScan:false,plannedFrames:times.length,completedFrames:sorted.length,plannedTimes:[...times],coverage:sorted.map(f=>({start:f.time,end:f.time})),denseRanges:[],tracks:buildTextTracks(sorted,step)};
}
export function resumeTextFrames(progress,times,source){
 if(!progress||progress.source!==source||progress.times.length!==times.length||progress.times.some((t,i)=>Math.abs(t-times[i])>1e-6))return[];
 // Validate saved completed times before skipping any recognition work.
 const checked=partialTextEvidence({...progress,times});return checked?.frames.slice()||[];
}
