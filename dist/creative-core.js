import {remixClips,storyboardCopy} from './remix-core.js';
import {validateStyleProfile} from './reference-style.js';
import {validate} from './core.js';
export const creativeStyles={punchy:{name:'节奏快剪',seconds:[1.8,1.2,2.4,1.5],effects:['push','none','push','none']},gentle:{name:'舒缓叙事',seconds:[3.8,4.5,3.2],effects:['fade','push','fade']},explain:{name:'清晰讲解',seconds:[3,4,3.5],effects:['none','push','none']}};
export function generateCopy(topic,kind='product'){
 const value=(topic||'这段记录').trim().replace(/\s+/g,' ').slice(0,40)||'这段记录';
 const lines=kind==='tutorial'?[`关于${value}，先看最终效果`,'把关键步骤，拆开来看','停在细节处，跟着操作一次','把方法记下来，下次再试']:kind==='story'?[`${value}，从这一刻开始`,'留意过程里的变化','让细节替我们讲述','把这个瞬间，留在这里']:[`${value}，从一个日常场景开始`,'换个角度，看看细节','把使用过程，展示清楚',`关于${value}，你最关注什么？`];
 return lines.map(s=>s.slice(0,200));
}
export function creativePlan(assets,{style='punchy',topic='',kind='product',target=15,referenceStyle=null,mode='remix',deferRemix=false}={}){
 if(style==='reference')validateStyleProfile(referenceStyle);
 if(style!=='reference'&&!Object.hasOwn(creativeStyles,style))throw Error('请选择支持的剪辑风格');
 if(!Number.isFinite(target)||target<3||target>60)throw Error('目标时长需为 3–60 秒');
 if(!assets.length||assets.some(a=>!Number.isFinite(a.duration)||a.duration<=0))throw Error('请先导入有效视频素材');
 const profile=style==='reference'?{name:referenceStyle.creator+' · 参考节奏',seconds:referenceStyle.seconds,effects:referenceStyle.effects}:creativeStyles[style],copy=generateCopy(topic,kind),total=assets.reduce((n,a)=>n+a.duration,0),budget=Math.min(target,total),used=assets.map(()=>0);let elapsed=0,next=0;const clips=[];
 while(elapsed<budget-.05&&clips.length<40){
  let index=-1;for(let j=0;j<assets.length;j++){const k=(next+j)%assets.length;if(assets[k].duration-used[k]>.05){index=k;break}}
  if(index<0)break;const n=clips.length,remaining=budget-elapsed,available=assets[index].duration-used[index];let duration=Math.min(profile.seconds[n%profile.seconds.length],remaining,available);
  if(available-duration<.5&&available<=remaining)duration=available;
  if(remaining-duration<.5&&remaining<=available)duration=remaining;
  const start=used[index],end=start+duration;clips.push({asset:index,start,end,caption:copy[Math.min(n,copy.length-1)],effect:profile.effects[n%profile.effects.length]});used[index]=end;elapsed+=duration;next=(index+1)%assets.length;
 }
 if(!clips.length)throw Error('素材时长不足');
 // Keep a clear ending without making factual product claims.
 clips.at(-1).caption=copy.at(-1);
 const edited=deferRemix?clips:storyboardCopy(style==='reference'?clips:remixClips(clips,assets,{spread:true,mode}),copy);
 return {...validate({clips:edited},assets),copy:copy.join('\n'),actual:elapsed,requested:target,truncated:elapsed<target-.1,style:profile.name,referenceStyle:style==='reference'?referenceStyle:undefined};
}
export function visualEffect(effect,elapsed,duration){
 const progress=Math.max(0,Math.min(1,elapsed/Math.max(.001,duration)));
 return {scale:effect==='push'?1+.08*progress:1,alpha:effect==='fade'?Math.max(0,Math.min(1,elapsed/Math.min(.3,duration/2),(duration-elapsed)/Math.min(.3,duration/2))):1};
}
