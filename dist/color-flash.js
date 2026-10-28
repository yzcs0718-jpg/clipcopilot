function color(frame){const p=frame.pixels,mean=[0,0,0];for(let i=0;i<p.length;i++)mean[i%3]+=p[i];for(let c=0;c<3;c++)mean[c]/=p.length/3;let uniform=0;for(let i=0;i<p.length;i+=3)if(mean.every((v,c)=>Math.abs(p[i+c]-v)<28))uniform++;return {rgb:mean,uniform:uniform/(p.length/3),saturation:(Math.max(...mean)-Math.min(...mean))/255}}
const difference=(a,b)=>a.pixels.length===b.pixels.length?a.pixels.reduce((n,v,i)=>n+Math.abs(v-b.pixels[i]),0)/a.pixels.length/255:1;
export function detectColorFlashes(samples){
 const f=samples.filter(f=>Number.isFinite(f.time)&&f.pixels?.length).sort((a,b)=>a.time-b.time);if(f.length<3)return[];const gaps=f.slice(1).map((v,i)=>v.time-f[i].time).filter(t=>t>0).sort((a,b)=>a-b),step=gaps[Math.floor(gaps.length/2)];if(!step)return[];
 const c=f.map(color),out=[],solid=i=>c[i].uniform>.9&&c[i].saturation>.35;
 for(let i=1;i<f.length-1;i++){if(!solid(i))continue;const start=i;while(i+1<f.length&&solid(i+1)&&c[i+1].rgb.every((v,j)=>Math.abs(v-c[start].rgb[j])<30))i++;const end=i;if(end===f.length-1)break;
  const before=f[start-1],after=f[end+1];if(after.time-before.time>.65||f[start].time-before.time>step*1.5||after.time-f[end].time>step*1.5||difference(before,after)>.18||difference(before,f[start])<.2||difference(after,f[end])<.2)continue;
  const hex='#'+c[start].rgb.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
  out.push({kind:'color-flash',start:before.time,end:after.time,title:'彩色闪帧候选',preview:{kind:'color-flash',color:hex,peakStart:f[start].time,peakEnd:f[end].time,precision:step},parameters:`实测主色 ${hex}；纯色采样 ${f[start].time.toFixed(3)}–${f[end].time.toFixed(3)} 秒，边界需逐帧校正`,reason:'短区间超过 90% 像素接近同一种高饱和颜色，前后画面较相似；也可能是现场彩灯或插入色卡，不确认原片用了特效预设。',steps:[`在 ${before.time.toFixed(3)}–${after.time.toFixed(3)} 秒附近放大剪映时间线，逐帧找到彩色画面实际起止帧。`,`添加纯色素材到上层轨道（手机端用画中画），颜色先试 ${hex}，不透明度 100%，裁到刚确认的起止点。`,'若原片是渐变闪色，给纯色层添加 0% → 100% → 0% 不透明度关键帧；若能透出底图，降低不透明度后对照调整，当前未识别混合模式。','循环播放并对齐动作与原声重音；保留原视频和音轨，比较前后是否突兀。']});
 }return out;
}
