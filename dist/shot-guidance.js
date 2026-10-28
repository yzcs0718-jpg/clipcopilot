export function effectsForShot(rows,shot){
 if(!Number.isFinite(shot.start)||!Number.isFinite(shot.end)||shot.end<=shot.start)return[];
 const unique=new Map();
 for(const row of rows)for(const item of row.evidence||[]){
  if(!Number.isFinite(item.start)||!Number.isFinite(item.end)||Math.min(item.end,shot.end)-Math.max(item.start,shot.start)<=1e-6)continue;
  const key=JSON.stringify([row.name,item.start,item.end,item.title,item.steps]);
  unique.set(key,{...item,category:row.name});
 }return [...unique.values()].sort((a,b)=>a.start-b.start||a.end-b.end);
}
export function renderShotGuidance(container,rows,shot){
 container.replaceChildren();const items=effectsForShot(rows,shot);
 const heading=document.createElement('h4');heading.textContent='这一段在剪映里怎么做';container.append(heading);
 if(!items.length){const p=document.createElement('p');p.className='muted';p.textContent='这一段暂无线索可生成针对性的操作。文字和空间检查完成后会自动更新；也可精查短效果。';container.append(p);const inspect=document.createElement('button');inspect.className='secondary';inspect.textContent='精查这一段';inspect.onclick=()=>document.dispatchEvent(new CustomEvent('short-effect-focus',{detail:{start:shot.start,end:shot.end}}));container.append(inspect);return}
 for(const item of items){const card=document.createElement('details');card.open=items.length===1;const title=document.createElement('summary');title.textContent=`${item.start.toFixed(2)}–${item.end.toFixed(2)} 秒 · ${item.title}`;card.append(title);const parameters=document.createElement('p');parameters.textContent=item.parameters||'';card.append(parameters);const steps=document.createElement('ol');for(const step of item.steps||[]){const li=document.createElement('li');li.textContent=step;steps.append(li)}card.append(steps);const open=document.createElement('button');open.className='secondary';open.textContent='查看效果帧与复现对比';open.onclick=()=>document.dispatchEvent(new CustomEvent('howto-focus',{detail:item}));card.append(open);const reason=document.createElement('p');reason.className='muted';reason.textContent=item.reason;card.append(reason);container.append(card)}
}
