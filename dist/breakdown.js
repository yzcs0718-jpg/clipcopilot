import{validFrameTime}from './frame-review-core.js?v=20261027motion';
import {runReferenceStages} from './analysis-stages.js?v=20261027motion';
import {referenceSampleTimes} from './reference-sampling.js?v=20261027motion';
import {buildEffectAudit,renderEffectAudit,auditReport} from './effect-audit.js?v=20261027motion';
import {textSteps,textEvidenceReport} from './text-evidence-core.js?v=20261027motion';
import {visualEffectCard,visualEffectsReport} from './visual-effects.js?v=20261027motion';
import {evidenceCard} from './effect-evidence.js?v=20261027motion';
import {captureInterval,renderEffectResult} from './effect-detail.js?v=20261027motion';
import {claimMediaTask,mediaTaskLabel} from './media-task.js?v=20261027motion';
import {timelineLessons} from './creation-guidance.js?v=20261027motion';
import {parseSrt,mapSubtitles} from './subtitles.js?v=20261027motion';
import {makeReferenceStyle} from './reference-style.js?v=20261027motion';
import {updateTeaching,updateTeachingEvidence,tutorialCard} from './teaching-video.js?v=20261027motion';
import {effectHint} from './lesson-core.js?v=20261027motion';
import {selection,requireModelCalls} from './provider-ui.js?v=20261027motion';
import {boundaries,recipes,report,restoreNotes} from './breakdown-core.js?v=20261027motion';
const $=id=>document.getElementById(id),player=$('ref-player');
let scanCancelled=false,deepRunning=false,pipelineStopped=false;
let spatialEvidence=null,textEvidence=null,audioAnalysisReport='',referenceFile=null,reference=null,samples=[],shots=[],lastReport='',scanning=false,loading=false,refURL=null,subtitleCues=[],knownTimeline=null,shotEnd=null;
const say=t=>{$('ref-status').textContent=t;if(scanning)$('ref-result-summary').textContent=t};
let inlinePreview=null;function stopInline(){if(inlinePreview){inlinePreview.pause();inlinePreview.removeAttribute('src');inlinePreview.load();inlinePreview.remove();inlinePreview=null}}
const guide=$('guide');function openGuide(){guide.showModal();$('guide-close').focus()};$('help').onclick=openGuide;$('help-top').onclick=openGuide;$('guide-close').onclick=() => guide.close();$('guide-start').onclick=()=>guide.close();openGuide();
function event(el,name){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{clean();reject(Error('读取视频超时，请换用浏览器支持的 MP4'))},15000);function clean(){clearTimeout(timer);el.removeEventListener(name,done);el.removeEventListener('error',fail)}function done(){clean();resolve()}function fail(){clean();reject(Error('视频无法解码，请尝试 H.264 视频、AAC 音频的 MP4'))}el.addEventListener(name,done,{once:true});el.addEventListener('error',fail,{once:true})})}
function invalidate(){effectResults=[];$('effect-output').replaceChildren();$('effect-download').disabled=true;$('effect-status').textContent='视频、镜头或笔记已变化，请重新运行视觉深析。';updateTeaching(shots,samples);lastReport='';$('ref-output').textContent='内容已变更，请重新生成报告。'}
async function load(file){
 if(scanning||loading||deepRunning)throw Error('正在处理参考视频，请先停止当前分析');
 const release=claimMediaTask('读取参考视频');loading=true;
 const ids=['ref-file','ref-demo','ref-effects-demo','ref-short-demo','ref-spatial-demo','ref-late-demo','ref-rectangle-demo','ref-motion-demo','ref-deep','ref-scan'];const states=ids.map(id=>[$(id),$(id).disabled]);states.forEach(([el])=>el.disabled=true);
 try{
 say(`正在读取 ${file.name}… 最多等待 15 秒。`);$('ref-filename').textContent=file.name;
 if(!file.size)throw Error('文件为空，请重新选择');
 spatialEvidence=null;textEvidence=null;$('ref-pipeline').hidden=true;$('teach-source').value='evidence';updateTeachingEvidence([]);$('effect-audit-list').replaceChildren();audioAnalysisReport='';document.dispatchEvent(new Event('reference-changed'));referenceFile=null;stopInline();$('effect-output').replaceChildren();$('effect-download').disabled=true;$('effect-status').textContent='已更换视频，尚未运行视觉深析。';$('ref-shot-index').replaceChildren();knownTimeline=null;shotEnd=null;subtitleCues=[];$('ref-transcript').value='';reference=null;lastReport='';samples=[];shots=[];$('ref-shots').replaceChildren();updateTeaching(shots,samples);$('ref-output').textContent='正在读取参考视频…';$('ref-result-summary').textContent='正在读取参考片，完成后将在这里显示逐段镜头。';$('ref-view-results').disabled=true;$('ref-results-teaching').disabled=true;player.pause();
 if(refURL)URL.revokeObjectURL(refURL);refURL=URL.createObjectURL(file);
 const ready=event(player,'loadedmetadata');player.preload='auto';player.src=refURL;player.load();await ready;
 if(!Number.isFinite(player.duration)||player.duration<=0||player.duration>600)throw Error('请选择时长不超过 10 分钟的视频');
 if(!player.videoWidth||!player.videoHeight)throw Error('未读到视频画面，请使用 H.264 / AAC 编码的 MP4');
 referenceFile=file;reference={name:file.name,duration:player.duration,width:player.videoWidth,height:player.videoHeight};document.dispatchEvent(new CustomEvent('reference-loaded',{detail:{duration:reference.duration}}));
 $('ref-filename').textContent=`${file.name} · ${player.duration.toFixed(1)} 秒`;
 invalidate();$('ref-result-summary').textContent='参考视频已读取，等待抽帧分析。';say(`已载入 ${file.name}，即将自动拉片…`);
 }catch(error){reference=null;player.pause();player.removeAttribute('src');player.load();if(refURL)URL.revokeObjectURL(refURL);refURL=null;$('ref-output').textContent='视频尚未载入，请重新选择。';$('ref-result-summary').textContent='读取未完成：'+error.message;throw error}
 finally{loading=false;states.forEach(([el,disabled])=>el.disabled=disabled);release()}
}
$('ref-file').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;e.target.value='';try{await load(file);await analyzeReference()}catch(error){say('导入失败：'+error.message)}};
$('ref-demo').onclick=async()=>{try{$('ref-file').value='';const r=await fetch(new URL('./demo/shot2.mp4',import.meta.url));if(!r.ok)throw Error('示例加载失败');await load(new File([await r.blob()],'demo-reference.mp4',{type:'video/mp4'}));$('ref-transcript').value='想让视频更有节奏？先展示结果，再补充过程。收藏这套剪辑方法。';say('示例已载入。文案是演示文本，并非示例视频的原声。正在自动拉片。');await $('ref-scan').onclick()}catch(e){say(e.message)}};
function updateAudit(){if(!reference||!shots.length)return;const rows=buildEffectAudit(samples,shots,{text:textEvidence,audio:!!audioAnalysisReport,spatial:spatialEvidence});renderEffectAudit($('effect-audit-list'),rows,seekReference);updateTeachingEvidence(rows.flatMap(r=>r.evidence).sort((a,b)=>a.start-b.start));$('effect-audit-summary').textContent=`${samples.length} 个采样帧 · ${shots.length} 个候选区间 · ${rows.filter(r=>r.evidence.length).length} 类有线索。${!textEvidence||!spatialEvidence?'部分检查尚未完成；查看上方完整分析进度和失败原因。':'文字与空间均已检查；有证据的步骤已展开，无可靠证据的项目保留待确认。'} 音效名称为可选独立分析。`;}
function seekReference(time){if(scanning||loading||!reference||mediaTaskLabel())return;stopInline();player.currentTime=Math.min(reference.duration-.001,Math.max(0,time));player.scrollIntoView({behavior:'smooth',block:'center'});player.play().catch(()=>say('请点击播放器播放按钮核对画面'));}
document.addEventListener('reference-seek',e=>seekReference(e.detail));
function render(){updateAudit();const scope=$('effect-scope'),previous=scope.value;scope.replaceChildren(new Option('全部候选镜头','all'));shots.forEach((s,i)=>scope.add(new Option(`镜头 ${i+1} · ${s.start.toFixed(1)}–${s.end.toFixed(1)} 秒`,String(i))));if([...scope.options].some(o=>o.value===previous))scope.value=previous;$('ref-result-summary').textContent=`${reference?.name||'参考视频'} · ${shots.length} 个区间。每张卡片包含时间点、参考画面和展开的剪映操作步骤。`;$('ref-view-results').disabled=!shots.length;$('ref-results-teaching').disabled=!shots.length;stopInline();const index=$('ref-shot-index');index.replaceChildren();const box=$('ref-shots');box.replaceChildren();shots.forEach((s,i)=>{const card=document.createElement('div');card.className='shot-card';card.id=`reference-shot-${i+1}`;card.tabIndex=-1;const jump=document.createElement('button');jump.className='secondary';jump.textContent=`${i+1} · ${s.start.toFixed(1)}s`;jump.onclick=()=>{card.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});card.focus({preventScroll:true})};index.append(jump);const pic=samples.reduce((best,f)=>Math.abs(f.time-(s.start+s.end)/2)<Math.abs(best.time-(s.start+s.end)/2)?f:best,samples[0]);if(pic){const img=document.createElement('img');img.src=pic.image;img.alt=`第 ${i+1} 段的参考帧，采样于 ${pic.time.toFixed(1)} 秒`;card.append(img)}const play=document.createElement('button');play.className='secondary';play.textContent=`${i+1} · ${s.start.toFixed(1)}–${s.end.toFixed(1)} 秒 ▶`;play.onclick=async()=>{try{stopInline();player.pause();const v=document.createElement('video');inlinePreview=v;v.className='shot-inline-preview';v.controls=true;v.playsInline=true;v.preload='auto';v.setAttribute('aria-label',`镜头 ${i+1} 区间预览`);const ready=event(v,'loadedmetadata');v.src=refURL;play.after(v);v.load();await ready;v.currentTime=s.start;v.addEventListener('timeupdate',()=>{if(v.currentTime>=s.end){v.pause()}});v.addEventListener('pause',()=>{if(reference)player.currentTime=Math.min(s.end,Math.max(s.start,v.currentTime))});await v.play()}catch(e){say(e.message)}};card.append(play);for(const [key,labelText] of [['note','画面 / 动作观察'],['copy','该段原文案']]){const label=document.createElement('label');label.textContent=labelText;const input=document.createElement('textarea');input.maxLength=1000;input.value=s[key]||'';input.placeholder=key==='note'?'例如：全景交代环境，随后切到产品特写':'请填写实际字幕或口播';input.oninput=()=>{s[key]=input.value;invalidate()};label.append(input);card.append(label)}const label=document.createElement('label');label.textContent='复现方式（采样建议，可手动校正）';const select=document.createElement('select');Object.keys(recipes).forEach(k=>{const op=document.createElement('option');op.textContent=k;op.value=k;select.append(op)});select.value=s.effect;select.onchange=()=>{s.effect=select.value;s.evidence='你手动选择的复现方式，不代表已识别原片效果。';render();invalidate()};label.append(select);card.append(label);if(i>0){const merge=document.createElement('button');merge.className='secondary';merge.textContent='与上一段合并';merge.onclick=()=>{shots[i-1].end=s.end;shots[i-1].evidence='用户合并后的区间可能包含多种效果；当前复现方式是待核对的学习建议。';knownTimeline=null;shots[i-1].note=[shots[i-1].note,s.note].filter(Boolean).join('；');shots[i-1].copy=[shots[i-1].copy,s.copy].filter(Boolean).join(' ');shots.splice(i,1);render();invalidate()};card.append(merge)}const evidence=document.createElement('p');evidence.className='effect-evidence';evidence.textContent=s.evidence||'复现方式是学习建议，不代表原片工程识别。';const lesson=tutorialCard(s);if(!knownTimeline){lesson.open=false;lesson.querySelector('summary').textContent=`手动学习步骤 · ${s.start.toFixed(2)}–${s.end.toFixed(2)} 秒（非检测结论）`}const notes=document.createElement('details');notes.className='shot-notes';const summary=document.createElement('summary');summary.textContent='补充画面笔记与原文案（选填）';notes.append(summary);[...card.children].filter(el=>el.tagName==='LABEL'&&el.querySelector('textarea')).forEach(el=>notes.append(el));card.append(evidence);play.after(lesson);lesson.after(evidenceCard(samples,s));lesson.before(visualEffectCard(samples,s));card.append(notes);box.append(card)});updateTeaching(shots,samples)}
$('ref-scan-stop').onclick=()=>{scanCancelled=true;say('正在停止抽帧，已完成的上次结果将保留…')};
async function scanReference(){if(loading)return say('正在读取参考视频，请稍候');if(!reference)return say('请先选择参考视频');if(scanning)return;let release;try{release=claimMediaTask('分析参考视频')}catch(e){return say(e.message)}const previous={samples,shots};scanCancelled=false;$('ref-scan-stop').hidden=false;stopInline();effectResults=[];$('effect-output').replaceChildren();$('effect-download').disabled=true;scanning=true;$('ref-result-summary').textContent='正在分析，请留意上传区的抽帧进度…';$('ref-view-results').disabled=true;$('ref-results-teaching').disabled=true;say('视频已读取，正在准备抽帧…');shotEnd=null;player.controls=false;const controls=['ref-creator','ref-source-url','ref-apply-style','ref-file','ref-demo','ref-effects-demo','ref-short-demo','ref-spatial-demo','ref-late-demo','ref-rectangle-demo','ref-motion-demo','ref-deep','ref-scan','ref-mark','ref-threshold','ref-density','ref-project-file','ref-save-project','ref-report','ref-ai'];const controlStates=controls.map(id=>[$(id),$(id).disabled]);controlStates.forEach(([el])=>el.disabled=true);try{player.pause();samples=[];const canvas=document.createElement('canvas');canvas.width=320;canvas.height=Math.max(1,Math.round(320*reference.height/reference.width));if(canvas.height>570){canvas.height=570;canvas.width=Math.max(1,Math.round(570*reference.width/reference.height))}const ctx=canvas.getContext('2d',{willReadFrequently:true});const tiny=document.createElement('canvas');tiny.width=64;tiny.height=36;const tc=tiny.getContext('2d',{willReadFrequently:true});const times=referenceSampleTimes(reference.duration,Number($('ref-density').value)),count=times.length;for(let i=0;i<count;i++){if(scanCancelled)throw Error('已停止抽帧，未采用本次不完整结果');const time=times[i];if(player.readyState<2)await event(player,'loadeddata');if(Math.abs(player.currentTime-time)>.001){const done=event(player,'seeked');player.currentTime=Math.max(0,time);await done}ctx.drawImage(player,0,0,canvas.width,canvas.height);tc.drawImage(player,0,0,64,36);const rgba=tc.getImageData(0,0,64,36).data,pixels=new Uint8Array(64*36*3);for(let j=0,k=0;j<rgba.length;j+=4){pixels[k++]=rgba[j];pixels[k++]=rgba[j+1];pixels[k++]=rgba[j+2]}samples.push({time,pixels,pixelWidth:64,pixelHeight:36,image:canvas.toDataURL('image/jpeg',.6)});say(`抽帧 ${i+1}/${count}，请暂勿操作参考视频…`)}shots=knownTimeline?timelineLessons(knownTimeline.plan,knownTimeline.assets,reference.duration):boundaries(samples,reference.duration,Number($('ref-threshold').value)).map(s=>({...s,note:'',copy:'',effect:effectHint(samples,s).effect,evidence:effectHint(samples,s).evidence}));render();lastReport=localReport();$('ref-output').textContent=lastReport;player.currentTime=0;say(`报告已生成：${samples.length} 个采样帧（间隔约 ${(reference.duration/(samples.length-1)).toFixed(3)} 秒）、${shots.length} 个候选区间。播放核对；漏切可暂停后添加切点，多切可合并。`);if(!deepRunning){$('ref-results').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});$('ref-results').focus({preventScroll:true})}return true}catch(e){samples=previous.samples;shots=previous.shots;if(shots.length)render();say('抽帧未完成：'+e.message);$('ref-result-summary').textContent='分析未完成：'+e.message;return false}finally{$('ref-scan-stop').hidden=true;scanning=false;player.controls=true;controlStates.forEach(([el,disabled])=>el.disabled=disabled);release()}};
$('ref-mark').onclick=()=>{if(!shots.length)return say('请先抽帧');const t=player.currentTime;const i=shots.findIndex(s=>t>s.start+.1&&t<s.end-.1);if(i<0)return say('切点太靠近已有边界');if(shots.length>=100)return say('最多保留 100 段');const old=shots[i];knownTimeline=null;const evidence='用户拆分后的区间；复现参数为学习建议，需要重新核对。';shots.splice(i,1,{...old,end:t,evidence},{...old,start:t,copy:'',note:'',evidence});render();invalidate();say(`已在 ${t.toFixed(2)} 秒添加切点`)};
function localReport(){if(!reference||!shots.length)throw Error('请先选择视频并完成抽帧');const transcript=$('ref-transcript').value.trim()||shots.map(s=>s.copy).filter(Boolean).join('\n');return report({...reference,shots,transcript,source:knownTimeline?'timeline':'sampled'})+visualEffectsReport(samples,shots)+auditReport(buildEffectAudit(samples,shots,{text:textEvidence,audio:!!audioAnalysisReport,spatial:spatialEvidence}))+(textEvidence?'\n\n'+textEvidenceReport(textEvidence):'')+(audioAnalysisReport?'\n\n## 原声音轨分析\n'+audioAnalysisReport:'')+'\n\n## 来源记录（用户填写，未核验）\n'+$('ref-creator').value.slice(0,80)+'\n'+$('ref-source-url').value.slice(0,2000)}
$('ref-report').onclick=()=>{try{lastReport=localReport();$('ref-output').textContent=lastReport;say('本地报告已生成：基于采样和输入文本的建议，未调用 AI')}catch(e){say(e.message)}};
$('ref-transcript').oninput=invalidate;
$('ref-textfile').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>100000)throw Error('文案文件请小于 100KB');const raw=await f.text();if(/\.srt$/i.test(f.name)){if(!reference)throw Error('请先加载对应的视频，再导入 SRT');subtitleCues=parseSrt(raw,reference.duration);const text=subtitleCues.map(c=>c.copy).join('\n');if(text.length>12000)throw Error('文案最多 12000 字符');$('ref-transcript').value=text;say('已读取真实字幕时间。完成拉片后点击“按 SRT 分配镜头文案”，会替换各镜头已有文案。')}else{if(raw.length>12000)throw Error('文案最多 12000 字符');subtitleCues=[];$('ref-transcript').value=raw;say('普通文案已导入；没有时间信息，不会编造字幕时间。')}invalidate()}catch(e){subtitleCues=[];say(e.message)}finally{e.target.value=''}};
$('ref-map-srt').onclick=()=>{try{if(scanning)throw Error('请等待抽帧完成');shots=mapSubtitles(shots,subtitleCues);render();invalidate();say('字幕已按实际时间与候选镜头重叠区间分配；跨镜头字幕可能出现在多个镜头中。')}catch(e){say(e.message)}};
$('ref-download').onclick=()=>{if(!lastReport)return say('请先重新生成报告');const url=URL.createObjectURL(new Blob([lastReport],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='ClipPilot-拉片报告.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)};
$('ref-ai').onclick=async()=>{try{requireModelCalls();const baseline=localReport();if(!$('api').value||!$('token').value)throw Error('请先在“连接自己的 AI 后端”配置地址和访问令牌；或使用本地报告');const base=new URL($('api').value);if(base.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(base.hostname))throw Error('后端地址必须使用 HTTPS');if(!confirm('将向你配置的模型服务发送最多 12 张低清抽帧、镜头笔记及文案。不发送原视频或音轨。是否继续？'))return;$('ref-ai').disabled=true;say('视觉模型分析中，可能需要约 1 分钟…');const frames=Array.from({length:Math.min(12,samples.length)},(_,i)=>samples[Math.round(i*(samples.length-1)/Math.max(1,Math.min(12,samples.length)-1))]).map(({time,image})=>({time,image}));const response=await fetch(base.origin+'/api/analyze',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+$('token').value},body:JSON.stringify({provider:selection('vision'),reference,frames,transcript:$('ref-transcript').value,shots:shots.map(({start,end,note,copy,effect})=>({start,end,note,copy,effect}))}),signal:AbortSignal.timeout(95000)});const data=await response.json();if(!response.ok)throw Error(data.error||'AI 分析失败');if(typeof data.analysis!=='string')throw Error('AI 返回格式不正确');lastReport=baseline+'\n\n## AI 深度分析（模型推断，请核对）\n'+data.analysis;$('ref-output').textContent=lastReport;say(`AI 分析完成（${data.provider||'后端默认'} / ${data.model||'已配置模型'}）。仅根据所传抽帧与文本，可能漏判动作和特效。`)}catch(e){say('AI 分析未完成：'+e.message)}finally{$('ref-ai').disabled=true}};

$('ref-save-project').onclick=()=>{try{
 localReport();const data={type:'clippilot-reference-notes',version:1,reference,shots,transcript:$('ref-transcript').value};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ClipPilot-拉片笔记.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);say('笔记备份已下载，不含源视频或抽帧图片。');
}catch(e){say(e.message)}};
$('ref-project-file').onchange=async e=>{try{
 if(scanning)throw Error('请等待抽帧完成');if(!reference||!samples.length)throw Error('请先加载并抽帧备份对应的源视频');
 const file=e.target.files[0];if(!file)return;if(file.size>500000)throw Error('笔记文件需小于 500KB');
 const loaded=restoreNotes(JSON.parse(await file.text()),reference);shots=loaded.shots;$('ref-transcript').value=loaded.transcript;render();lastReport=localReport();$('ref-output').textContent=lastReport;say('拉片笔记与镜头区间已恢复，本地报告已更新。');
}catch(e){say('恢复失败：'+e.message)}finally{e.target.value=''}};

$('ref-apply-style').onclick=()=>{try{const profile=makeReferenceStyle({creator:$('ref-creator').value,url:$('ref-source-url').value,reference,shots});document.dispatchEvent(new CustomEvent('reference-style',{detail:profile}));$('ref-style-status').textContent='参考节奏已发送到创意剪辑；不会自动抓取账号内容，来源身份未核验。'}catch(e){$('ref-style-status').textContent=e.message}};

export async function localReferenceTask(run){
 if(scanning||!reference||!samples.length||!shots.length)throw Error('请先加载参考视频并完成拉片，或等待当前抽帧结束');const release=claimMediaTask('解读本地参考帧');scanning=true;const states=new Map([...document.querySelectorAll('button,input,select,textarea')].map(e=>[e,e.disabled]));states.forEach((_,e)=>e.disabled=true);
 try{const frames=Array.from({length:Math.min(12,samples.length)},(_,i)=>samples[Math.round(i*(samples.length-1)/Math.max(1,Math.min(12,samples.length)-1))]).map(({time,image})=>({time,image}));say('本地视觉模型正在分析参考帧与文案；稀疏抽帧不能确定全部效果。');const result=await run({reference,frames,shots:shots.map(({start,end,note,copy,effect})=>({start,end,note,copy,effect})),transcript:$('ref-transcript').value});lastReport=localReport()+'\n\n## 本地视觉模型补充（推断，需核对）\n'+(result.skill?'参考 Skill：'+result.skill.name+'\n来源：'+result.skill.url+'\n版本：'+result.skill.commit+'\n方式：'+result.skill.method+'\n\n':'')+result.analysis;$('ref-output').textContent=lastReport;say('本地视觉分析已加入报告，不能视为原工程还原。');return result;
 }finally{scanning=false;states.forEach((disabled,e)=>e.disabled=disabled);release()}
}

player.addEventListener('timeupdate',()=>{if(shotEnd!==null&&player.currentTime>=shotEnd){player.pause();shotEnd=null}});
document.addEventListener('analyze-created-video',async e=>{if(scanning)return say('正在拉片，请等待当前分析完成');try{$('tab-breakdown').click();await load(e.detail.file);knownTimeline={plan:e.detail.plan,assets:e.detail.assets};$('teach-source').value='manual';$('ref-status').scrollIntoView({behavior:'smooth',block:'center'});const ok=await $('ref-scan').onclick();if(!ok)return;say(`已按本工作台的 ${shots.length} 段真实剪辑参数生成剪映步骤。逐段参数在下方展开；可继续生成教学示意 MP4。不是剪映实机录屏。`)}catch(error){say('成片拉片未完成：'+error.message)}});

document.addEventListener('workspace-navigation',stopInline);

let effectResults=[];
$('effect-download').onclick=()=>{if(!effectResults.length)return;const url=URL.createObjectURL(new Blob([JSON.stringify({reference,method:'本地模型复现建议，非原工程识别',results:effectResults},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ClipPilot-逐镜头效果分析.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)};
export async function effectReferenceTask(run,signal){
 if(scanning||loading||!reference||!shots.length)throw Error('请先载入视频并完成候选分段');
 const value=$('effect-scope').value,selected=value==='all'?shots.map((s,index)=>({s:structuredClone(s),index})):[{s:structuredClone(shots[Number(value)]),index:Number(value)}];
 if(selected.some(x=>!x.s))throw Error('请选择有效镜头');
 const release=claimMediaTask('逐镜头视觉深析');scanning=true;stopInline();player.pause();const states=new Map([...document.querySelectorAll('button,input,select,textarea')].map(el=>[el,el.disabled]));states.forEach((_,el)=>el.disabled=true);$('effect-cancel').hidden=false;$('effect-cancel').disabled=false;
 effectResults=[];$('effect-output').replaceChildren();
 try{for(const {s,index} of selected){if(signal.aborted)throw Error('分析已停止，已完成结果保留');const frames=await captureInterval(refURL,s,reference.duration,signal,n=>{$('effect-status').textContent=`镜头 ${index+1}：重新采样 ${n}/12 帧…`});$('effect-status').textContent=`正在分析镜头 ${index+1}（${effectResults.length+1}/${selected.length}），本地模型可能需要数分钟…`;const result=await run({reference,shot:{start:s.start,end:s.end},frames,transcript:$('ref-transcript').value,effectDetail:true});if(signal.aborted)throw Error('分析已停止，未采用当前镜头结果');effectResults.push({...result,index});renderEffectResult($('effect-output'),result,index)}$('effect-status').textContent=`已分析 ${effectResults.length} 个镜头。模型结论是复现建议，请逐项对照原片，不代表原参数。`;
 }finally{scanning=false;states.forEach((disabled,el)=>el.disabled=disabled);$('effect-cancel').hidden=true;$('effect-download').disabled=!effectResults.length;release()}
}

export async function referenceAudioTask(run,{example=false,stopId='browser-audio-stop',taskName='浏览器音轨分析'}={}){
 if(scanning||loading||!example&&(!reference||!referenceFile))throw Error('请先载入参考视频，并等待当前任务完成');
 const release=claimMediaTask(taskName);scanning=true;stopInline();player.pause();const states=new Map([...document.querySelectorAll('button,input,select,textarea')].map(el=>[el,el.disabled]));states.forEach((_,el)=>el.disabled=true);$(stopId).disabled=false;if(deepRunning)$('ref-pipeline-stop').disabled=false;
 try{return await run({file:referenceFile,reference:structuredClone(reference),shots:structuredClone(shots)})}finally{scanning=false;states.forEach((disabled,el)=>el.disabled=disabled);release()}
}

document.addEventListener('browser-audio-result',event=>{audioAnalysisReport=event.detail;updateAudit();if(reference&&shots.length){lastReport=localReport();$('ref-output').textContent=lastReport}});

document.addEventListener('text-evidence-result',event=>{textEvidence=event.detail;updateAudit();if(reference&&shots.length){lastReport=localReport();$('ref-output').textContent=lastReport}});

$('ref-effects-demo').onclick=async()=>{try{const r=await fetch(new URL('./demo/effects-fixture.mp4',import.meta.url));if(!r.ok)throw Error('效果测试片读取失败');await load(new File([await r.blob()],'effects-fixture.mp4',{type:'video/mp4'}));await scanReference();say('原创几何测试片已拉片；此片用于测试有限检测能力，不能证明任意视频识别准确。点击“识别画面文字”可继续测试字幕。')}catch(e){say(e.message)}};

$('ref-short-demo').onclick=async()=>{try{$('ref-density').value='24';const r=await fetch(new URL('./demo/short-flash-fixture.mp4',import.meta.url));if(!r.ok)throw Error('短闪白测试片读取失败');await load(new File([await r.blob()],'short-flash-fixture.mp4',{type:'video/mp4'}));await scanReference();say('单帧闪白测试片已完成精细采样；请在整片效果检查中核对闪白候选。合成测试通过不代表任意视频识别准确。')}catch(e){say(e.message)}};

document.addEventListener('spatial-evidence-result',event=>{spatialEvidence=event.detail;updateAudit();if(reference&&shots.length){lastReport=localReport();$('ref-output').textContent=lastReport}});

$('ref-spatial-demo').onclick=async()=>{try{const r=await fetch(new URL('./demo/spatial-fixture.mp4',import.meta.url));if(!r.ok)throw Error('空间测试片读取失败');await load(new File([await r.blob()],'spatial-fixture.mp4',{type:'video/mp4'}));await scanReference();say('原创中文花字 / 圆形窗口测试片已载入。点击深度拉片，真实运行文字与空间模型；测试答案不会注入检测。')}catch(e){say(e.message)}};
const stageNames=['镜头与画面变化','中文字幕与动画轨迹','蒙版窗口、人物与跟随'];
function setPipelineRow(index,state,message=''){
 const row=$('ref-pipeline-list').children[index];row.dataset.state=state;
 const labels={waiting:'等待中',running:'进行中',done:'已完成',failed:'未完成',cancelled:'已停止'};
 row.querySelector('strong').textContent=`${index+1}. ${stageNames[index]} · ${labels[state]}`;
 row.querySelector('p').textContent=message;
}
function showPipeline(){
 $('ref-pipeline').hidden=false;$('ref-pipeline-list').replaceChildren();
 stageNames.forEach((_,i)=>{const row=document.createElement('li');row.append(document.createElement('strong'),document.createElement('p'));$('ref-pipeline-list').append(row);setPipelineRow(i,'waiting')});
 $('ref-pipeline-stop').hidden=false;$('ref-pipeline-stop').disabled=false;
}
function stopPipeline(){pipelineStopped=true;scanCancelled=true;if(!$('text-stop').hidden)$('text-stop').onclick();if(!$('spatial-stop').hidden)$('spatial-stop').onclick();$('ref-pipeline-status').textContent='正在停止；已完成结果会保留，不再启动后续检查。'}
$('ref-pipeline-stop').onclick=stopPipeline;
for(const id of ['ref-scan-stop','text-stop','spatial-stop'])$(id).addEventListener('click',()=>{if(deepRunning)pipelineStopped=true});
async function analyzeReference(){
 if(deepRunning||scanning||loading)return say('已有分析正在运行，请查看上方实时进度');
 if(!reference)return say('请先选择视频');
 deepRunning=true;pipelineStopped=false;showPipeline();
 const controls=['ref-file','ref-scan','ref-basic','ref-deep','ref-demo','ref-effects-demo','ref-short-demo','ref-spatial-demo','ref-late-demo','ref-rectangle-demo','ref-motion-demo'];
 const states=controls.map(id=>[$(id),$(id).disabled]);states.forEach(([el])=>el.disabled=true);
 let active=-1,observer;
 try{
 const stages=[{title:stageNames[0],required:true,run:scanReference,message:()=>$('ref-status').textContent},
 {title:stageNames[1],run:()=>$('text-start').onclick(),message:()=>$('text-status').textContent},
 {title:stageNames[2],run:()=>$('spatial-start').onclick(),message:()=>$('spatial-status').textContent}];
 observer=new MutationObserver(()=>{if(active<0||pipelineStopped)return;const text=stages[active].message();setPipelineRow(active,'running',text);$('ref-pipeline-status').textContent=`正在检查 ${active+1}/3 · ${text}`});
 for(const id of ['ref-status','text-status','spatial-status'])observer.observe($(id),{childList:true,subtree:true,characterData:true});
 const result=await runReferenceStages(stages,(i,state,message)=>{active=state==='running'?i:-1;setPipelineRow(i,state,message||'正在准备；首次运行需下载免费模型，保持页面前台。');$('ref-pipeline-status').textContent=`${i+1}/3 · ${stageNames[i]} · ${state==='running'?'进行中':state==='done'?'已完成':'未完成'}`},()=>pipelineStopped);
 observer.disconnect();active=-1;
 const done=result.results.filter(r=>r.ok).length;
 for(let i=result.results.length;i<3;i++)setPipelineRow(i,'cancelled',result.cancelled?'用户停止，未运行此项。':'镜头分析失败，尚不能继续。');
 const message=result.cancelled?`分析已停止，已完成 ${done}/3 项。已完成的证据保留，可点击“重新完整分析”重试。`:result.complete?'三项检查已完成。下方直接查看时间点、实测证据和剪映试做步骤。':`已完成 ${done}/3 项。未完成的原因已列在上方，其余结果已保留；可单独重试失败步骤。`;
 $('ref-pipeline-status').textContent=message;say(message);
 if(reference&&shots.length){updateAudit();lastReport=localReport();$('ref-output').textContent=lastReport;$('ref-result-summary').textContent=message;$('ref-results').scrollIntoView({behavior:'smooth',block:'start'});$('ref-results').focus({preventScroll:true})}
 return result.complete;
 }catch(error){say('完整分析未完成：'+error.message);$('ref-pipeline-status').textContent='完整分析未完成：'+error.message;return false}
 finally{observer?.disconnect();deepRunning=false;$('ref-pipeline-stop').hidden=true;states.forEach(([el,disabled])=>el.disabled=disabled)}
}
$('ref-scan').onclick=analyzeReference;$('ref-deep').onclick=analyzeReference;
$('ref-basic').onclick=()=>{if(deepRunning)return;return scanReference()};

$('ref-late-demo').onclick=async()=>{try{const r=await fetch(new URL('./demo/late-tracking-fixture.mp4',import.meta.url));if(!r.ok)throw Error('后半段跟随测试片读取失败');await load(new File([await r.blob()],'late-tracking-fixture.mp4',{type:'video/mp4'}));await scanReference();say('原创后出现目标测试片已载入。点击深度拉片，核对 2 秒之后的文字与独立目标轨迹。检测不读取预期答案。')}catch(e){say(e.message)}};

$('ref-rectangle-demo').onclick=async()=>{try{const r=await fetch(new URL('./demo/rectangle-fixture.mp4',import.meta.url));if(!r.ok)throw Error('矩形测试片读取失败');await load(new File([await r.blob()],'rectangle-fixture.mp4',{type:'video/mp4'}));await scanReference();say('原创矩形正反例测试片已载入：纯色卡片、静态纹理、动态窗口与空白。点击“分析窗口、人物与跟随”验证；检测不读取预期答案。')}catch(e){say(e.message)}};

document.addEventListener('reference-frame-seek',event=>{if(scanning||loading||mediaTaskLabel())return say('当前正在处理视频，结束后可定位原片');const time=validFrameTime(event.detail,reference?.duration);if(time===null||!referenceFile)return;stopInline();shotEnd=null;player.pause();player.currentTime=time;player.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});say(`已定位原片 ${time.toFixed(2)} 秒并暂停，可使用播放器逐帧核对。`)});

$('ref-motion-demo').onclick=async()=>{try{const r=await fetch(new URL('./demo/text-motion-fixture.mp4',import.meta.url));if(!r.ok)throw Error('字幕动画测试片读取失败');await load(new File([await r.blob()],'text-motion-fixture.mp4',{type:'video/mp4'}));await scanReference();say('原创往返与缩放字幕样片已载入。先基础识别，再展开“精查短字幕动画”检查中途转折；检测不读取预期答案。')}catch(e){say(e.message)}};
