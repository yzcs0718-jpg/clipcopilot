const diff=(a,b)=>{let s=0;for(let i=0;i<a.length;i++)s+=Math.abs(a[i]-b[i]);return s/a.length/255};
const contrast=a=>{let m=0;for(const v of a)m+=v;m/=a.length;let s=0;for(const v of a)s+=(v-m)**2;return Math.sqrt(s/a.length)/255};
export function detectDissolves(samples){
 const frames=samples.filter(f=>Number.isFinite(f.time)&&f.pixels?.length).sort((a,b)=>a.time-b.time),found=[];
 for(let i=0;i<frames.length-6;i++)for(let span=6;span<=14&&i+span<frames.length;span++){
  const range=frames.slice(i,i+span+1);let a=range[0],b=range.at(-1),duration=b.time-a.time;
  if(i<2||i+span+2>=frames.length||diff(frames[i-2].pixels,a.pixels)>.01||diff(b.pixels,frames[i+span+2].pixels)>.01)continue;
  if(duration<.5||duration>2.5||range.some((f,j)=>f.pixels.length!==a.pixels.length||j&&f.time-range[j-1].time>duration*.24)||contrast(a.pixels)<.1||contrast(b.pixels)<.1||diff(a.pixels,b.pixels)<.10)continue;
  const delta=Array.from(a.pixels,(v,j)=>b.pixels[j]-v);let den=0,dm=0;for(const v of delta){den+=v*v;dm+=v}dm/=delta.length;
  if(Math.sqrt(den/delta.length-dm*dm)/255<.09)continue; // Uniform exposure/fade is not a two-image mixture.
  const nodes=[];let valid=true,previous=-1;
  for(const f of range){let dot=0;for(let j=0;j<delta.length;j++)dot+=(f.pixels[j]-a.pixels[j])*delta[j];const alpha=dot/den;let residual=0;for(let j=0;j<delta.length;j++)residual+=Math.abs(f.pixels[j]-a.pixels[j]-alpha*delta[j]);residual/=delta.length*255;
   if(alpha<-.025||alpha>1.025||alpha<previous-.035||residual>.018){valid=false;break}nodes.push({time:f.time,alpha:Math.max(0,Math.min(1,alpha))});previous=alpha;
  }
  const mid=nodes.filter(n=>n.alpha>.08&&n.alpha<.92);
  if(!valid||mid.length<3||mid.at(-1).alpha-mid[0].alpha<.4||!mid.some(n=>n.alpha>.35&&n.alpha<.65))continue;
  const lo=Math.max(0,nodes.findIndex(n=>n.alpha>.025)-1),hi=Math.min(nodes.length-1,nodes.findLastIndex(n=>n.alpha<.975)+1);a=range[lo];b=range[hi];duration=b.time-a.time;
  if(found.some(e=>Math.min(e.end,b.time)>Math.max(e.start,a.time)))continue;
  found.push({kind:'dissolve',start:a.time,end:b.time,title:'双画面叠化 / 透明度混合候选',preview:{kind:'dissolve',keyframes:nodes.slice(lo,hi+1)},parameters:`混合试做区间 ${a.time.toFixed(3)}–${b.time.toFixed(3)} 秒（${duration.toFixed(3)} 秒）；上层不透明度约 0% → 100%`,reason:'至少三个中间采样可由前后两幅有纹理画面按递增比例混合近似，区别于瞬间硬切与纯亮度变化。移动素材、光流或复杂混合可能漏检；并非确认使用了剪映叠化预设。',stepTimes:[a.time,a.time,b.time,b.time],steps:[`在剪映中定位 ${a.time.toFixed(3)}–${b.time.toFixed(3)} 秒，将前后两段素材分别放到底层与上层轨道，保留约 ${duration.toFixed(3)} 秒重叠。`,`选中上层后画面，在 ${a.time.toFixed(3)} 秒为不透明度添加关键帧，先设为 0%。`,`到 ${b.time.toFixed(3)} 秒添加关键帧，不透明度设为 100%；下面的前画面保持可见直到过渡结束。`,'回放中间帧检查是否同时能看见两幅画面；也可在两段素材切口搜索“叠化”并从该时长开始试。参考视频已压平时，先另备前后两段素材，不能从单帧恢复被遮住的完整内容。']});
 }
 return found;
}
