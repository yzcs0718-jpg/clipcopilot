function info(f){const y=[],chroma=[];let strength=0;for(let i=0;i<f.pixels.length;i+=3){const l=f.pixels[i]*.2126+f.pixels[i+1]*.7152+f.pixels[i+2]*.0722;y.push(l/255);for(let c=0;c<3;c++){const d=(f.pixels[i+c]-l)/255;chroma.push(d);strength+=Math.abs(d)}}return{y,chroma,strength:strength/f.pixels.length}}
function detectColorRange(samples,shot){
 const f=samples.filter(f=>f.time>=shot.start&&f.time<shot.end&&f.pixels?.length).sort((a,b)=>a.time-b.time);if(f.length<7||f.at(-1).time-f[0].time<.8||f.at(-1).time-f[0].time>8)return[];
 const chosen=Array.from({length:7},(_,i)=>f[Math.round(i*(f.length-1)/6)]);if(chosen.some((f,i)=>f.pixels.length!==chosen[0].pixels.length||i&&f.time-chosen[i-1].time>1.4))return[];
 const images=chosen.map(info),first=images[0],last=images.at(-1),desaturate=first.strength>last.strength,reference=desaturate?first:last,den=reference.chroma.reduce((s,v)=>s+v*v,0);if(reference.strength<.055||Math.min(first.strength,last.strength)>.018||den<1)return[];
 const nodes=[];for(let i=0;i<images.length;i++){const image=images[i],grayError=image.y.reduce((s,v,j)=>s+Math.abs(v-reference.y[j]),0)/image.y.length,gain=image.chroma.reduce((s,v,j)=>s+v*reference.chroma[j],0)/den,residual=image.chroma.reduce((s,v,j)=>s+Math.abs(v-gain*reference.chroma[j]),0)/image.chroma.length;if(grayError>.025||residual>.018||gain<-.03||gain>1.08)return[];nodes.push({time:chosen[i].time,saturation:Math.max(0,Math.min(1,gain))})}
 for(let i=1;i<nodes.length;i++)if((nodes[i].saturation-nodes[i-1].saturation)*(desaturate?-1:1)<-.06)return[];
 if(Math.abs(nodes.at(-1).saturation-nodes[0].saturation)<.7||nodes.filter(n=>n.saturation>.1&&n.saturation<.9).length<2)return[];
 const start=chosen[0].time,end=chosen.at(-1).time;
 return[{kind:'saturation',start,end,title:desaturate?'彩色逐渐变黑白 / 去色候选':'黑白逐渐恢复彩色候选',preview:{kind:'saturation',keyframes:nodes,baseTime:desaturate?start:end},stepTimes:[start,...nodes.map(n=>n.time),end],parameters:`相对本段彩色参考的色彩强度约 ${Math.round(nodes[0].saturation*100)}% → ${Math.round(nodes.at(-1).saturation*100)}%；不是剪映原饱和度数值`,reason:'七个采样的亮度结构较相似，颜色偏离灰度的分量按近似同一比例增减，端点接近黑白。也可能来自源素材或现场光线，不判断滤镜/LUT名称；运动、色温和曝光变化可能导致漏判。',steps:[`在剪映中定位 ${start.toFixed(3)}–${end.toFixed(3)} 秒，选中片段，进入“调节”，找到“饱和度”。`,...nodes.map(n=>`到 ${n.time.toFixed(3)} 秒检查参考帧，色彩强度约为彩色端点的 ${Math.round(n.saturation*100)}%。${n.saturation<.08?'将饱和度先拉到最低得到黑白，再校正亮度和对比度。':n.saturation>.92?'恢复到彩色参考对应的饱和度，保留原有亮度构图。':'在彩色与完全去色之间试调饱和度；该百分比是像素测量，不等于软件滑块刻度。'}当前版本若支持调节关键帧，在此打点。`),'若你的版本不能给调节项打关键帧，将彩色原片放底层，完全去色的同片段副本放上层并对齐；去色时上层不透明度从0%升至100%，恢复彩色时从100%降至0%，以此近似中间颜色强度；参考片已去色时，需另备彩色素材，不能恢复真实原色。']}];
}

export function detectColorChanges(samples,shot){
 const f=samples.filter(f=>f.time>=shot.start&&f.time<shot.end&&f.pixels?.length).sort((a,b)=>a.time-b.time);
 const attempt=frames=>{const r=detectColorRange(frames,shot);if(r.length||frames.length<8)return r;for(const trimmed of [frames.slice(1),frames.slice(0,-1),frames.slice(1,-1)]){const found=detectColorRange(trimmed,shot);if(found.length)return found}return[]};
 const direct=attempt(f);if(direct.length)return direct;
 // Colour effects must not depend on the coarser RGB scene-cut threshold.
 const runs=[];let run=[],previous=null;for(const frame of f){const image=info(frame);if(previous){const error=image.y.length===previous.y.length?image.y.reduce((s,v,j)=>s+Math.abs(v-previous.y[j]),0)/image.y.length:1;if(error>.04){if(run.length)runs.push(run);run=[]}}run.push(frame);previous=image}if(run.length)runs.push(run);
 const result=[];for(const run of runs){if(run.length<7)continue;const candidate=attempt(run);for(const e of candidate)if(!result.some(old=>Math.min(old.end,e.end)>Math.max(old.start,e.start)))result.push(e)}return result;
}
