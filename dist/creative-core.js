import {remixClips,storyboardCopy} from './remix-core.js?v=20261027review';
import {validateStyleProfile} from './reference-style.js?v=20261027review';
import {validate} from './core.js?v=20261027review';
export const creativeStyles={punchy:{name:'节奏快剪',seconds:[1.8,1.2,2.4,1.5],effects:['push','none','push','none']},gentle:{name:'舒缓叙事',seconds:[3.8,4.5,3.2],effects:['fade','push','fade']},explain:{name:'清晰讲解',seconds:[3,4,3.5],effects:['none','push','none']}};
export function creativePlan(assets,{style='punchy',topic='',kind='product',target=15,referenceStyle=null,mode='remix',deferRemix=false}={}){
 if(style==='reference')validateStyleProfile(referenceStyle);
 if(style!=='reference'&&!Object.hasOwn(creativeStyles,style))throw Error('请选择支持的剪辑风格');
 if(!Number.isFinite(target)||target<3||target>60)throw Error('目标时长需为 3–60 秒');
 if(!assets.length||assets.some(a=>!Number.isFinite(a.duration)||a.duration<=0))throw Error('请先导入有效视频素材');
 const profile=style==='reference'?{name:referenceStyle.creator+' · 参考节奏',seconds:referenceStyle.seconds,effects:referenceStyle.effects}:creativeStyles[style],copy=[],total=assets.reduce((n,a)=>n+a.duration,0),budget=Math.min(target,total),used=assets.map(()=>0);let elapsed=0,next=0;const clips=[];let reserved=0;const eligible=[];for(let i=0;i<assets.length;i++){const minimum=Math.min(.75,assets[i].duration);if(reserved+minimum<=budget+.001){eligible.push(i);reserved+=minimum}}
 while(elapsed<budget-.05&&clips.length<100){
  let index=-1;for(let j=0;j<eligible.length;j++){const k=eligible[(next+j)%eligible.length];if(assets[k].duration-used[k]>.05){index=k;break}}
  if(index<0)break;const n=clips.length,remaining=budget-elapsed,available=assets[index].duration-used[index];const reserve=style==='reference'?0:eligible.filter(i=>i!==index&&used[i]===0).reduce((sum,i)=>sum+Math.min(.75,assets[i].duration),0),cap=Math.max(0,remaining-reserve);let duration=Math.min(profile.seconds[n%profile.seconds.length],cap,available);if(duration<.0001)break;
  if(available-duration<.5&&available<=cap)duration=available;
  if(cap-duration<.5&&cap<=available)duration=cap;
  const start=used[index],end=start+duration;clips.push({asset:index,start,end,caption:copy[Math.min(n,copy.length-1)]||'',effect:profile.effects[n%profile.effects.length]});used[index]=end;elapsed+=duration;next=(eligible.indexOf(index)+1)%eligible.length;
 }
 if(!clips.length)throw Error('素材时长不足');
 // Keep a clear ending without making factual product claims.
 clips.at(-1).caption=copy.at(-1)||'';
 const edited=deferRemix?clips:storyboardCopy(style==='reference'?clips:remixClips(clips,assets,{spread:true,mode}),copy);
 return {...validate({clips:edited},assets),copy:copy.join('\n'),actual:elapsed,requested:target,truncated:elapsed<target-.1,style:profile.name,referenceStyle:style==='reference'?referenceStyle:undefined};
}
export function visualEffect(effect,elapsed,duration){
 const progress=Math.max(0,Math.min(1,elapsed/Math.max(.001,duration)));
 return {scale:effect==='push'?1+.08*progress:1,alpha:effect==='fade'?Math.max(0,Math.min(1,elapsed/Math.min(.3,duration/2),(duration-elapsed)/Math.min(.3,duration/2))):1};
}
