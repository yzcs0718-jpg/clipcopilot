const round=n=>Math.round(n*1000)/1000;
export function buildProductionChecklist(reference,shots,rows,audio=null){
 if(!reference||!Number.isFinite(reference.duration)||reference.duration<=0||reference.duration>600||!Array.isArray(shots)||!shots.length)throw Error('先导入视频并完成分镜，才能生成制作清单');
 const tasks=[],seen=new Set();
 function add(task){if(!Number.isFinite(task.start)||!Number.isFinite(task.end)||task.start<0||task.end<task.start||task.end>reference.duration+.1)throw Error('制作清单含无效时间');const id=JSON.stringify([task.category,task.start,task.end,task.title,task.parameters,task.steps]);if(seen.has(id))return;seen.add(id);tasks.push({...task,id})}
 shots.forEach((s,i)=>add({category:'分镜核对',start:s.start,end:s.end,title:`镜头 ${i+1}：核对切点和保留内容`,parameters:`候选区间 ${s.start.toFixed(2)}–${s.end.toFixed(2)} 秒`,reason:'来自候选分镜，不是对原片剪辑意图的识别。',steps:['回看这段原片，检查区间两端是否是真正切点。','在剪映导入自己的对应素材，按动作或句意分割；误切可合并。','检查主体裁切和衔接，填写自己的制作备注。']}));
 for(const row of rows||[])for(const item of row.evidence||[])add({category:row.name,start:item.start,end:item.end,title:item.title,parameters:item.parameters||'',reason:item.reason||'',steps:[...(item.steps||[])]});
 if(audio?.mode==='events')for(const segment of audio.segments||[]){const candidates=(segment.candidates||[]).filter(c=>typeof c.label==='string'&&Number.isFinite(c.score)).slice(0,3);if(!candidates.length)continue;add({category:'声音候选核对',start:segment.start,end:segment.end,title:'听辨声音候选：'+candidates.map(c=>c.label).join(' / '),parameters:candidates.map(c=>c.label+' 模型分数 '+c.score.toFixed(3)+'（不是准确率）').join('；'),reason:'来自已运行声音分类模型的候选；不能确认现场声、后期音效或原音效库。',steps:['回放这一段原声音轨，核对声音标签是否符合实际。','若需要模仿声音节奏，在剪映音频轨对齐动作或字幕入点。','调整音量与淡入淡出，再与原片听辨对照；不根据候选标签认定素材来源。']})}
 if(tasks.length>6000)throw Error('候选任务过多，请缩小视频或精查范围');tasks.sort((a,b)=>a.start-b.start||a.end-b.end||a.category.localeCompare(b.category));
 const lengths=shots.map(s=>s.end-s.start);if(lengths.some(n=>!Number.isFinite(n)||n<=0))throw Error('候选镜头时长无效');const sorted=[...lengths].sort((a,b)=>a-b),middle=sorted.length>>1,median=sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;
 return{schema:'clippilot.production-checklist/v1',reference:{name:String(reference.name||'参考视频').slice(0,500),duration:reference.duration},rhythm:{shots:shots.length,median:round(median),shortest:round(sorted[0]),longest:round(sorted.at(-1)),cutsPerMinute:round(Math.max(0,shots.length-1)*60/reference.duration)},tasks,unknown:(rows||[]).filter(r=>!r.evidence?.length).map(r=>({category:r.name,status:r.status,limit:r.limit})),notice:'候选证据与人工核对清单，不是剪映工程或自动执行方案。勾选仅表示用户已核对，未检查项不能当作不存在。'};
}
export function checklistView(data,review,category='all',status='all',page=0,size=10){
 if(!Number.isInteger(size)||size<1||size>50)throw Error('无效分页');
 const tasks=data.tasks.filter(t=>(category==='all'||t.category===category)&&(status==='all'||(status==='done')===!!review.get(t.id)?.checked)),pages=Math.max(1,Math.ceil(tasks.length/size)),current=Math.max(0,Math.min(pages-1,Number.isInteger(page)?page:0));
 return{tasks:tasks.slice(current*size,(current+1)*size),page:current,pages,total:tasks.length,done:data.tasks.filter(t=>review.get(t.id)?.checked).length};
}
export function reviewedChecklist(data,review){return{...data,tasks:data.tasks.map(t=>({...t,checked:!!review.get(t.id)?.checked,userNote:String(review.get(t.id)?.note||'').slice(0,1000)}))}}
const csvCell=value=>{let s=String(value??'');if(/^\s*[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
export function checklistCSV(data,review){const d=reviewedChecklist(data,review);return '\uFEFF'+[['核对状态','类别','开始秒','结束秒','任务','试做参数','操作步骤','判断依据与限制','我的备注'],...d.tasks.map(t=>[t.checked?'已人工核对':'待核对',t.category,t.start.toFixed(3),t.end.toFixed(3),t.title,t.parameters,t.steps.map((s,i)=>`${i+1}. ${s}`).join('\n'),t.reason,t.userNote])].map(row=>row.map(csvCell).join(',')).join('\r\n')}
