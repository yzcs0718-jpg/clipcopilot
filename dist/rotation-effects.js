const gray=f=>{const a=[];for(let i=0;i<f.pixels.length;i+=3)a.push((f.pixels[i]+f.pixels[i+1]+f.pixels[i+2])/765);return a};
export function estimateRotation(a,b,w,h,sourceAspectRatio=w/h){
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<16||h<16||w>128||h>128||a.length!==w*h||b.length!==a.length)return null;
 const sx=sourceAspectRatio*h/w;if(!Number.isFinite(sx)||sx<.15||sx>6)return null;
 const error=(angle,dx,dy)=>{const r=angle*Math.PI/180,c=Math.cos(r),s=Math.sin(r);let sum=0,n=0;
  for(let y=6;y<h-6;y+=2)for(let x=6;x<w-6;x+=2){const xx=x-w/2-dx,yy=y-h/2-dy,ax=xx*c+yy*s/sx+w/2,ay=-xx*s*sx+yy*c+h/2,ix=Math.floor(ax),iy=Math.floor(ay);if(ix<0||iy<0||ix+1>=w||iy+1>=h)continue;const u=ax-ix,v=ay-iy,value=a[iy*w+ix]*(1-u)*(1-v)+a[iy*w+ix+1]*u*(1-v)+a[(iy+1)*w+ix]*(1-u)*v+a[(iy+1)*w+ix+1]*u*v;sum+=Math.abs(value-b[y*w+x]);n++}return n?sum/n:Infinity};
 let best={error:Infinity,angle:0},baseline=Infinity;
 for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++){baseline=Math.min(baseline,error(0,dx,dy));for(let angle=-20;angle<=20;angle++){const e=error(angle,dx,dy);if(e<best.error)best={error:e,angle,dx,dy}}}
 return {...best,baseline,improvement:baseline>0?(baseline-best.error)/baseline:0};
}
export function detectRotationEffects(samples,shot){
 const f=samples.filter(f=>f.time>=shot.start&&f.time<shot.end&&f.pixelWidth&&f.pixelHeight&&f.pixels?.length).sort((a,b)=>a.time-b.time);if(f.length<5)return[];
 const chosen=Array.from({length:5},(_,i)=>f[Math.round(i*(f.length-1)/4)]),first=chosen[0],last=chosen.at(-1),duration=last.time-first.time;if(duration<.6||chosen.some((f,i)=>f.pixelWidth!==first.pixelWidth||f.pixelHeight!==first.pixelHeight||i&&f.time-chosen[i-1].time>duration*.45))return[];
 const images=chosen.map(gray);if(images.some(a=>{const m=a.reduce((s,v)=>s+v,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/a.length)<.08}))return[];
 const fits=images.slice(1).map(a=>estimateRotation(images[0],a,first.pixelWidth,first.pixelHeight,first.sourceAspectRatio));if(fits.some(f=>!f||f.error>.045))return[];
 const end=fits.at(-1);if(Math.abs(end.angle)<5||end.improvement<.45)return[];
 let previous=0;for(let i=0;i<fits.length;i++){const angle=fits[i].angle,progress=angle/end.angle,expected=(chosen[i+1].time-first.time)/duration;if(progress<previous-.08||Math.abs(progress-expected)>.3)return[];previous=progress}
 const keyframes=[{time:first.time,angle:0},...fits.map((f,i)=>({time:chosen[i+1].time,angle:f.angle}))],direction=a=>`${a>=0?'顺时针':'逆时针'} ${Math.abs(a).toFixed(0)}°`;
 return[{kind:'rotation',start:first.time,end:last.time,title:'画面旋转 / 旋转关键帧候选',preview:{kind:'rotation',keyframes},stepTimes:[first.time,...keyframes.slice(1).map(n=>n.time),last.time],parameters:`相对起始画面${direction(end.angle)}；5 个位置节点，约 1° 搜索步长`,reason:'中心旋转对齐比仅平移明显改善，四个后续采样角度方向连续。也可能是相机滚转或平面主体转动；未恢复原旋转中心、缩放或动画曲线。',steps:[`在剪映主轨选中素材，定位 ${first.time.toFixed(3)} 秒，在画面旋转旁添加起始关键帧，保留当前角度。`,...keyframes.slice(1).map(n=>`到 ${n.time.toFixed(3)} 秒添加旋转关键帧，相对起始角度将画面${direction(n.angle)}，对照固定背景校准方向。`),'先用线性过渡回放核对；可适当放大素材遮住旋转露出的黑边。若主体和背景转动不同步，不要对整层套用同一旋转。']}];
}
