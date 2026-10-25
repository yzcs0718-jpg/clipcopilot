// Subtitles must come from supplied copy or an explicitly enabled local model.
export function applySuppliedCopy(result,{mode='none',text=''}={}){
 if(!['none','manual','skill'].includes(mode))throw Error('请选择有效的字幕来源');
 if(mode==='skill')return result;
 const clips=structuredClone(result.clips);clips.forEach(c=>c.caption='');
 if(mode==='none')return {...result,clips,copy:''};
 if(typeof text!=='string'||text.length>22000)throw Error('字幕文案最多 22000 字符');
 const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 if(!lines.length)throw Error('请填写要使用的实际文案；没有文案时请选择“不加字幕”');
 if(lines.some(s=>s.length>200))throw Error('每行字幕最多 200 字');
 if(lines.length>clips.length)throw Error('文案行数超过镜头数，请合并文案或增加镜头');
 for(let i=0;i<lines.length;i++)clips[Math.floor(i*clips.length/lines.length)].caption=lines[i];
 return {...result,clips,copy:lines.join('\n')};
}
export function sourceRatio(assets){
 const votes={'16:9':0,'9:16':0,'1:1':0};
 for(const a of assets){if(!Number.isFinite(a.width)||!Number.isFinite(a.height)||a.width<=0||a.height<=0)continue;const r=a.width/a.height;votes[r>1.2?'16:9':r<.83?'9:16':'1:1']+=Math.min(a.duration||1,60)}
 return Object.keys(votes).sort((a,b)=>votes[b]-votes[a])[0];
}
export function creativeExplanation(plan,assets,mode='remix'){
 const clips=plan.clips||[];if(!clips.length)return '导入素材并生成混剪后，这里解释实际采用的剪辑结构。';
 const first=clips[0],last=clips.at(-1),names=new Set(clips.map(c=>c.asset));
 const structure=mode==='sequence'?'按源顺序推进，保持步骤先后':'用后段片段作预告式开场，再回接过程';
 return `结构：${structure}。开场取自「${assets[first.asset]?.name||'素材'}」${first.start.toFixed(1)}–${first.end.toFixed(1)} 秒；结尾取自「${assets[last.asset]?.name||'素材'}」${last.start.toFixed(1)}–${last.end.toFixed(1)} 秒。${names.size>1?'中段交替使用 '+names.size+' 条素材，改变画面节奏。':'中段通过分散取材和镜头时长调整节奏。'}这份说明来自时间线参数，不代表识别了剧情或高潮。`;
}
export function timelineLessons(plan,assets,duration){
 const total=plan.clips.reduce((n,c)=>n+c.end-c.start,0);if(!(total>0&&duration>0))throw Error('缺少有效成片时间线');let offset=0;
 return plan.clips.map(c=>{const start=offset/total*duration;offset+=c.end-c.start;return {start,end:offset/total*duration,note:`本工作台生成的镜头，源文件「${assets[c.asset]?.name||'素材'}」${c.start.toFixed(2)}–${c.end.toFixed(2)} 秒。成片定位按实际文件总时长换算，切口需回放核对。`,copy:c.caption,effect:c.effect==='push'?'缓慢推近':c.effect==='fade'?'叠化 / 淡入淡出':'硬切 / 节奏切换',evidence:c.effect==='push'?'来自当前工程参数：缩放 100%→108%。不是反推原视频。':c.effect==='fade'?'来自当前工程参数：单镜头透明度淡入淡出，不是两个镜头的叠化。':'来自当前工程参数：片段首尾直接切换。'}});
}
