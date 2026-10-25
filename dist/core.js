export function validate(plan,assets){if(!plan||!Array.isArray(plan.clips)||!plan.clips.length)throw Error('请先创建时间线');if(plan.clips.length>100)throw Error('最多 100 个片段');for(const c of plan.clips){const a=assets[c.asset];if(!Number.isInteger(c.asset)||!a||!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<0||c.end<=c.start||c.end>a.duration+.01)throw Error('片段时间超出素材范围');if(c.effect!==undefined&&!['none','push','fade'].includes(c.effect))throw Error('不支持的画面效果');if(typeof c.caption!=='string'||c.caption.length>200)throw Error('字幕最多 200 字');}return plan;}export function srt(plan){let t=0;const fmt=s=>{let n=Math.round(s*1000);return `${String(Math.floor(n/3600000)).padStart(2,'0')}:${String(Math.floor(n/60000)%60).padStart(2,'0')}:${String(Math.floor(n/1000)%60).padStart(2,'0')},${String(n%1000).padStart(3,'0')}`};return plan.clips.map((c,i)=>{const start=t;t+=c.end-c.start;return `${i+1}\n${fmt(start)} --> ${fmt(t)}\n${c.caption}\n`}).join('\n');}
export function scriptPlan(text,assets,seconds=5){
 if(!assets.length)throw Error('请先导入视频素材');
 if(!Number.isFinite(seconds)||seconds<1||seconds>60)throw Error('每段时长为 1–60 秒');
 const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!/^#{1,6}\s/.test(s)).map(s=>s.replace(/^[-*]\s+|^\d+[.)]\s+/,''));
 if(!lines.length||lines.length>100)throw Error('请填写 1–100 行文案，每行生成一个镜头');
 if(lines.some(s=>s.length>200))throw Error('单行文案最多 200 字');
 const used=assets.map(()=>0);let next=0;const clips=[];
 for(const caption of lines){let index=-1;for(let j=0;j<assets.length;j++){const k=(next+j)%assets.length;if(assets[k].duration-used[k]>.1){index=k;break}}
 if(index<0)throw Error('素材剩余时长不足；请缩短默认秒数或增加素材');const start=used[index],end=Math.min(assets[index].duration,start+seconds);clips.push({asset:index,start,end,caption});used[index]=end;next=(index+1)%assets.length;
 }return validate({clips},assets)
}

export function splitClip(plan,index,time,assets){
 validate(plan,assets);const c=plan.clips[index];
 if(!c||!Number.isFinite(time)||time<=c.start+.05||time>=c.end-.05)throw Error('切点需位于片段内部，距两端至少 0.05 秒');
 if(plan.clips.length>=100)throw Error('最多 100 个片段');
 const next=structuredClone(plan);next.clips.splice(index,1,{...c,end:time},{...c,start:time});return validate(next,assets);
}
