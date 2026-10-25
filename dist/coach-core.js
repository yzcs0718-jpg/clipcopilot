export const templates={
 product:{name:'产品展示',lines:['[使用场景]：谁遇到了什么具体问题？','[细节证明]：展示产品如何解决这个问题','[结果回扣]：用真实结果收尾，给一个明确行动']},
 tutorial:{name:'教程讲解',lines:['[最终效果]：先让观众知道将学会什么','[操作步骤]：一次只讲一个关键动作','[常见误区]：说明容易出错的位置与解决方式','[总结]：回顾方法，给一个可立即尝试的动作']},
 story:{name:'故事记录',lines:['[开头]：用一个具体事件交代人物与处境','[变化]：发生了什么转折？保留关键过程','[结尾]：回扣开头，用真实感受收尾']}
};
export function auditTimeline(plan,assets,goal='product'){
 const clips=Array.isArray(plan?.clips)?plan.clips:[],issues=[];let total=0;const seen=new Set();
 if(!clips.length)issues.push({level:'error',index:null,text:'请先导入素材并创建时间线。'});
 if(clips.length>100)issues.push({level:'error',index:null,text:'时间线超过 100 段，请删减后导出。'});
 const offsets=[];
 clips.forEach((c,i)=>{
  offsets.push(total);const a=assets[c?.asset],valid=c&&Number.isInteger(c.asset)&&a&&Number.isFinite(c.start)&&Number.isFinite(c.end)&&c.start>=0&&c.end>c.start&&c.end<=a.duration+.01;
  if(!valid){issues.push({level:'error',index:i,text:'素材或起止时间无效，请检查这一段。'});return}
  const duration=c.end-c.start;total+=duration;
  if(typeof c.caption!=='string'||c.caption.length>200){issues.push({level:'error',index:i,text:'字幕需为文本，且不超过 200 字。'});return}
  if(duration<.6)issues.push({level:'note',index:i,text:'片段短于 0.6 秒，检查动作和字幕是否来得及看清。'});
  if(duration>8)issues.push({level:'note',index:i,text:'片段超过 8 秒，检查是否存在重复信息，必要时拆分。'});
  const density=c.caption.replace(/\s/g,'').length/duration,limit=/[\u3400-\u9fff]/.test(c.caption)?7:18;
  if(density>limit)issues.push({level:'note',index:i,text:`字幕密度约 ${density.toFixed(1)} 字符/秒，建议缩短文案或延长展示时间；这是阅读量提示，不是语音测量。`});
  if(/\[[^\]]+\]|【待填写】/.test(c.caption))issues.push({level:'note',index:i,text:'字幕仍含模板占位词，请替换成真实内容。'});
  const key=`${c.asset}:${c.start}:${c.end}`;if(seen.has(key))issues.push({level:'note',index:i,text:'重复使用了同一素材区间；确认是有意重复。'});seen.add(key);
 });
 const kind=Object.hasOwn(templates,goal)?goal:'product';
 const strategy={product:'先交代使用场景或真实结果，中段用近景证明细节，结尾回扣用途；不要填入未经证实的效果或数据。',tutorial:'先展示最终效果，再按操作顺序解释步骤；每个镜头承担一个动作，最后指出常见误区。',story:'用具体事件开头，中段保留变化或转折，结尾回扣开头；删除重复交代的信息。'}[kind];
 const shotAdvice=clips.map((c,i)=>({index:i,time:offsets[i],text:i===0?'开头：核对第一画面能否快速说明主题；不只依赖标题。':i===clips.length-1?'结尾：检查是否回应开头，并留下一个清楚的结束点。':'中段：确认这一段补充了新的过程、证据或细节。'}));
 return {total,count:clips.length,blocking:issues.some(x=>x.level==='error'),issues,strategy,shotAdvice};
}
export function templateDraft(kind,assets=[]){
 const value=templates[kind];if(!value)throw Error('请选择支持的脚本模板');
 const available=assets.reduce((n,a)=>n+(Number.isFinite(a.duration)?a.duration:0),0);
 return {text:value.lines.join('\n'),seconds:Math.max(1,Math.min(5,Math.floor(available/value.lines.length)||5))};
}
export function wrapCaption(text,maxWidth,measure){
 const lines=[];for(const paragraph of text.split(/\r?\n/)){let line='';for(const ch of paragraph){if(line&&measure(line+ch)>maxWidth){lines.push(line);line=ch}else line+=ch}lines.push(line)}return lines;
}
export function captionLayout(text,width,height,measure){
 let size=Math.round(width/24),lines=[];
 const minimum=Math.max(8,Math.floor(width/64));
 while(size>=minimum){lines=wrapCaption(text,width*.88,s=>measure(s,size));if(lines.length*size*1.3<=height*.28)break;size--}
 size=Math.max(size,minimum);lines=wrapCaption(text,width*.88,s=>measure(s,size));
 return {size,lines,lineHeight:size*1.3,bottom:height*.91};
}
