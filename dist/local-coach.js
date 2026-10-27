import {auditTimeline,templates,templateDraft} from './coach-core.js?v=20261027review';
const $=id=>document.getElementById(id);let latest={clips:[],assets:[]};
function audit(){
 const data=auditTimeline({clips:latest.clips},latest.assets,$('coach-goal').value);
 $('check-summary').textContent=data.blocking?'有 '+data.issues.filter(x=>x.level==='error').length+' 项需要修正，修正后再导出':`可导出 · ${data.count} 段 / ${data.total.toFixed(1)} 秒 · ${data.issues.length} 条建议`;
 $('check-summary').dataset.state=data.blocking?'error':'ready';$('coach-strategy').textContent=data.strategy;
 const list=$('check-list');list.replaceChildren();
 for(const issue of data.issues){const item=document.createElement('li');item.textContent=(issue.level==='error'?'需修正':'建议')+(issue.index===null?'':` · 镜头 ${issue.index+1}`)+'：'+issue.text;
  if(issue.index!==null){const go=document.createElement('button');go.className='text-button';go.textContent='查看这一段';go.onclick=()=>{document.querySelector('.timeline-panel').open=true;document.querySelectorAll('#timeline>.clip')[issue.index]?.querySelector('input')?.focus()};item.append(go)}list.append(item)}
 if(!data.issues.length){const li=document.createElement('li');li.textContent='时间区间和字幕格式检查通过。请连续预览，人工核对画面、字幕与音轨。';list.append(li)}
 $('coach-shots').replaceChildren();for(const s of data.shotAdvice){const p=document.createElement('p');p.textContent=`${s.index+1} · 成片 ${s.time.toFixed(1)} 秒起 — ${s.text}`;$('coach-shots').append(p)}
 return data;
}
document.addEventListener('plan-update',e=>{latest=e.detail;audit()});
$('coach-goal').onchange=audit;
$('coach-template').onclick=()=>{const draft=templateDraft($('coach-goal').value,latest.assets);$('script-text').value=draft.text;$('seconds').value=draft.seconds;document.querySelector('.script-panel').open=true;$('script-text').focus();$('script-status').textContent=`已填入${templates[$('coach-goal').value].name}模板；请替换方括号内容，再生成分镜。片段默认 ${draft.seconds} 秒，可调整。`;$('script-text').dispatchEvent(new Event('input'))};
$('preflight').onclick=()=>{audit();document.querySelector('.coach-panel').open=true;$('check-summary').focus()};
$('coach-download').onclick=()=>{const data=audit(),text=`# ClipPilot 本地剪辑检查\n\n${$('check-summary').textContent}\n\n${data.strategy}\n\n${data.issues.map(i=>`- ${i.index===null?'项目':'镜头 '+(i.index+1)}：${i.text}`).join('\n')}\n\n${data.shotAdvice.map(s=>`- ${s.time.toFixed(1)} 秒起 / 镜头 ${s.index+1}：${s.text}`).join('\n')}\n\n仅依据时间线和输入文字进行本地规则检查，没有识别画面或音频，没有调用远程模型。`;
 const url=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='ClipPilot-剪辑检查.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)};
audit();
