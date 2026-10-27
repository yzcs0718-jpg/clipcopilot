import {canCompare} from './comparison-core.js?v=20261027motion';
// Render only measured evidence. Manual learning recipes stay in their own section.
export function renderHowTo(container,rows,onSeek){
 container.replaceChildren();
 const entries=rows.flatMap(row=>row.evidence.map(item=>({...item,category:row.name}))).sort((a,b)=>a.start-b.start);
 const status=document.createElement('p');status.className='muted';status.textContent=entries.length?`找到 ${entries.length} 项可试做线索。先播放对应时间，再按步骤操作；参数是复现起点，需对照原片调整。`:'还没有可展示的效果线索。完整分析后，有证据的剪映做法会出现在这里；没有可靠证据时不编造操作参数。';container.append(status);
 const index=document.createElement('div');index.className='howto-index';index.setAttribute('aria-label','按效果定位剪映做法');container.append(index);
 entries.forEach((item,i)=>{
  const card=document.createElement('details');card.className='howto-card';card.open=i===0;
  const summary=document.createElement('summary');summary.textContent=`${item.start.toFixed(2)}–${item.end.toFixed(2)} 秒 · ${item.title}`;card.append(summary);
  const jump=document.createElement('button');jump.className='secondary';jump.textContent=`${i+1} · ${item.category} · ${item.start.toFixed(1)} 秒`;jump.onclick=()=>{card.open=true;card.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});summary.focus({preventScroll:true})};index.append(jump);
  const actions=document.createElement('div');actions.className='row';
  const play=document.createElement('button');play.className='secondary';play.textContent='看原片这一段';play.onclick=()=>onSeek(item.start);
  const teach=document.createElement('button');teach.textContent='生成这项教学 MP4';teach.onclick=()=>document.dispatchEvent(new CustomEvent('teach-evidence-item',{detail:item}));
  const copy=document.createElement('button');copy.className='secondary';copy.textContent='复制剪映步骤';const notice=document.createElement('p');notice.className='muted';notice.setAttribute('role','status');
  const fallback=document.createElement('textarea');fallback.hidden=true;fallback.readOnly=true;fallback.setAttribute('aria-label','可复制的剪映步骤');
  copy.onclick=async()=>{const text=`${summary.textContent}\n${item.parameters}\n${item.steps.map((step,n)=>`${n+1}. ${step}`).join('\n')}\n${item.reason}`;let timer;try{await Promise.race([navigator.clipboard.writeText(text),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('复制权限未响应')),1500)})]);fallback.hidden=true;notice.textContent='已复制，可在剪映旁边对照操作。'}catch{fallback.value=text;fallback.hidden=false;fallback.focus();fallback.select();notice.textContent='步骤已选中，请按 Ctrl+C（Mac 用 ⌘C）复制。'}finally{clearTimeout(timer)}};
  const compare=document.createElement('button');compare.className='secondary';compare.textContent=canCompare(item)?'原片 / 复现对比':'对比预览暂不支持本项';compare.disabled=!canCompare(item);compare.onclick=()=>document.dispatchEvent(new CustomEvent('compare-effect',{detail:item}));const inspect=document.createElement('button');inspect.className='secondary';inspect.textContent='精查附近短效果';inspect.onclick=()=>document.dispatchEvent(new CustomEvent('short-effect-focus',{detail:{start:item.start,end:item.end}}));actions.append(play,compare,teach,copy,inspect);card.append(actions);
  const parameters=document.createElement('p');parameters.textContent=item.parameters;card.append(parameters);
  const heading=document.createElement('h5');heading.textContent='剪映里怎么操作';card.append(heading);
  const steps=document.createElement('ol');item.steps.forEach(step=>{const li=document.createElement('li');li.textContent=step;steps.append(li)});card.append(steps);
  const reason=document.createElement('p');reason.className='muted';reason.textContent='判断依据与限制：'+item.reason;card.append(reason,notice,fallback);container.append(card);
 });
}
