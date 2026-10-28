const brightness=f=>{let sum=0,dark=0;for(let i=0;i<f.pixels.length;i+=3){const r=f.pixels[i],g=f.pixels[i+1],b=f.pixels[i+2];sum+=.2126*r+.7152*g+.0722*b;if(Math.max(r,g,b)<30)dark++}return{level:sum/(f.pixels.length/3)/255,black:dark/(f.pixels.length/3)>.9}};
export function detectDarkFlashes(samples){
 const frames=samples.filter(f=>Number.isFinite(f.time)&&f.pixels?.length).sort((a,b)=>a.time-b.time),out=[];
 if(frames.length<3)return out;const gaps=frames.slice(1).map((f,i)=>f.time-frames[i].time).filter(t=>t>0).sort((a,b)=>a-b),step=gaps[Math.floor(gaps.length/2)];if(!step)return out;
 const values=frames.map(brightness);
 for(let i=1;i<frames.length-1;i++){
  if(!values[i].black||values[i].level>.08)continue;const first=i;
  while(i+1<frames.length&&values[i+1].black&&values[i+1].level<=.08)i++;
  const last=i;if(last===frames.length-1)break;
  const a=frames[first-1],b=frames[last+1];
  if(b.time-a.time>.65||frames[first].time-a.time>step*1.5||b.time-frames[last].time>step*1.5||Math.min(values[first-1].level,values[last+1].level)-Math.max(values[first].level,values[last].level)<.25)continue;
  out.push({kind:'dark-flash',start:a.time,end:b.time,title:'短暂黑闪候选',preview:{kind:'dark-flash',peakStart:frames[first].time,peakEnd:frames[last].time,precision:step},parameters:`黑画面采样 ${frames[first].time.toFixed(3)}–${frames[last].time.toFixed(3)} 秒；试做范围 ${a.time.toFixed(3)}–${b.time.toFixed(3)} 秒，边界需逐帧校正`,reason:`${last-first+1} 个连续采样中超过 90% 像素接近黑色，前后亮度恢复；也可能是镜头遮挡、素材断帧或现场熄灯，不据此确认用了黑闪预设。`,steps:[`导入视频到剪映主轨道，在 ${a.time.toFixed(3)}–${b.time.toFixed(3)} 秒放大时间线，逐帧对照参考片的变黑和恢复位置。`,'添加纯黑色素材到上层轨道（手机端可用画中画），裁到刚确认的起止帧；没有黑色素材时，用纯黑图片。','先试瞬间黑闪：黑色层不透明度保持 100%；若原片逐渐变黑，改用 0% → 100% → 0% 不透明度关键帧。','试听原声并保留底层音轨；循环播放对照，调短或延长黑色层，不要直接套用默认一秒转场。']});
 }return out;
}
