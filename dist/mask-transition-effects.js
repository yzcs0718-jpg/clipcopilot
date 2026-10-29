const diff=(a,b)=>{let s=0;for(let i=0;i<a.length;i++)s+=Math.abs(a[i]-b[i]);return s/a.length/255};
const contrast=a=>{let m=0;for(const v of a)m+=v;m/=a.length;let s=0;for(const v of a)s+=(v-m)**2;return Math.sqrt(s/a.length)/255};
export function maskGeometry(shape,opening,progress,width,height){
 const p=Math.max(0,Math.min(1,progress)),size=opening?p:1-p;
 if(!['x','y','rectangle','circle'].includes(shape)||!Number.isFinite(size)||!(width>0&&height>0))return null;
 if(shape==='circle')return{shape:'circle',cx:width/2,cy:height/2,radius:Math.hypot(width,height)/2*size,invert:!opening};
 const w=shape==='y'?width:width*size,h=shape==='x'?height:height*size;return{shape:'rectangle',x:(width-w)/2,y:(height-h)/2,width:w,height:h,invert:!opening};
}
// Fit symmetric two-boundary, rectangular, or circular reveal against observed endpoints.
export function fitMaskTransition(a,b,f,w,h,aspect=w/h){
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<16||h<16||w>128||h>128||a.length!==w*h*3||b.length!==a.length||f.length!==a.length)return null;
 const sx=aspect*h/w;if(!Number.isFinite(sx)||sx<.15||sx>6)return null;const diagonal=Math.hypot(w*sx,h)/2;let best={error:Infinity};
 for(const shape of ['x','y','rectangle','circle']){
  const A=new Float64Array(65),B=new Float64Array(65);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const nx=Math.abs((x+.5-w/2)/(w/2)),ny=Math.abs((y+.5-h/2)/(h/2)),rank=shape==='x'?nx:shape==='y'?ny:shape==='rectangle'?Math.max(nx,ny):Math.hypot((x+.5-w/2)*sx,y+.5-h/2)/diagonal,k=Math.min(64,Math.ceil(rank*64));
   for(let c=0;c<3;c++){const i=(y*w+x)*3+c;A[k]+=Math.abs(f[i]-a[i]);B[k]+=Math.abs(f[i]-b[i])}
  }
  const allA=A.reduce((s,v)=>s+v,0),allB=B.reduce((s,v)=>s+v,0);let insideA=0,insideB=0;
  for(let k=0;k<=64;k++){insideA+=A[k];insideB+=B[k];for(const opening of [true,false]){const error=(opening?insideB+allA-insideA:insideA+allB-insideB)/a.length/255;if(error<best.error)best={shape,opening,progress:opening?k/64:1-k/64,error}}}
 }return best;
}
export function detectMaskTransitions(samples){
 const f=samples.filter(f=>Number.isFinite(f.time)&&f.pixelWidth&&f.pixelHeight&&f.pixels?.length).sort((a,b)=>a.time-b.time),out=[];
 for(let i=2;i<f.length-8;i++)for(let span=6;span<=16&&i+span+2<f.length;span++){
  const range=f.slice(i,i+span+1),a=range[0],b=range.at(-1),duration=b.time-a.time,w=a.pixelWidth,h=a.pixelHeight;
  if(duration<.5||duration>2.7||range.some((p,j)=>p.pixelWidth!==w||p.pixelHeight!==h||p.pixels.length!==a.pixels.length||j&&p.time-range[j-1].time>duration*.24)||diff(f[i-2].pixels,a.pixels)>.01||diff(b.pixels,f[i+span+2].pixels)>.01||diff(a.pixels,b.pixels)<.13||Math.max(contrast(a.pixels),contrast(b.pixels))<.1)continue;
  if(out.some(e=>Math.min(e.end,b.time)>Math.max(e.start,a.time))||range.slice(1,-1).filter(p=>diff(p.pixels,a.pixels)>.02&&diff(p.pixels,b.pixels)>.02).length<3)continue;
  const fits=range.map(p=>({...fitMaskTransition(a.pixels,b.pixels,p.pixels,w,h,a.sourceAspectRatio),time:p.time})),mid=fits.filter(p=>p.progress>.1&&p.progress<.9);if(mid.length<3)continue;
  const model=mid[Math.floor(mid.length/2)];let previous=0,valid=true;
  for(const p of fits){if(p.error>.022||p.progress<previous-.055||p.progress>.1&&p.progress<.9&&(p.shape!==model.shape||p.opening!==model.opening)){valid=false;break}previous=p.progress}
  if(!valid||mid.at(-1).progress-mid[0].progress<.4||!mid.some(p=>p.progress>.35&&p.progress<.65))continue;
  const lo=Math.max(0,fits.findIndex(p=>p.progress>.03)-1),hi=Math.min(fits.length-1,fits.findLastIndex(p=>p.progress<.97)+1),start=range[lo].time,end=range[hi].time,keyframes=fits.slice(lo,hi+1).map(p=>({time:p.time,progress:p.progress})),nodes=[keyframes[0],mid[Math.floor(mid.length/2)],keyframes.at(-1)],names={x:'横向对开 / 合拢',y:'纵向对开 / 合拢',rectangle:'矩形扩展 / 收缩',circle:'圆形扩展 / 收缩'},opening=model.opening,shape=model.shape,measure=shape==='x'?'宽度':shape==='y'?'高度':shape==='rectangle'?'宽高':'半径',route=shape==='circle'?'圆形':'矩形';
  out.push({kind:'mask-transition',start,end,title:`${names[shape]}蒙版转场候选`,preview:{kind:'mask-transition',shape,opening,keyframes},parameters:`后画面从${shape==='x'?(opening?'中央向左右':'左右向中央'):shape==='y'?(opening?'中央向上下':'上下向中央'):(opening?'中央向四周':'四周向中央')}显露；${start.toFixed(3)}–${end.toFixed(3)} 秒；中心对称几何估计，边界需逐帧校准`,reason:'至少三个中间帧可由两幅稳定端点画面通过同一种中心对称区域替换近似，边界尺度连续。也可能是实物遮挡或其他遮罩；不确认原蒙版预设。偏心、旋转、大羽化、移动素材和复杂边缘可能漏检。',stepTimes:[start,start,...nodes.map(n=>n.time),end],steps:[`在剪映定位 ${start.toFixed(3)}–${end.toFixed(3)} 秒，前画面放底层、后画面放上层，重叠约 ${(end-start).toFixed(3)} 秒。`,`选中上层后画面 → 蒙版 → ${route}，中心对齐画布中心；${shape==='x'?'高度覆盖画布，只调整宽度；':shape==='y'?'宽度覆盖画布，只调整高度；':''}${opening?'保留蒙版内部':'启用反转，保留蒙版外部'}。羽化先设为0；蒙版尺寸关键帧入口随剪映版本可能不同。`,...nodes.map(n=>`到 ${n.time.toFixed(3)} 秒添加蒙版尺寸关键帧：${measure}先试完整覆盖画布所需尺寸的 ${((opening?n.progress:1-n.progress)*100).toFixed(0)}%；${shape==='circle'?'完全覆盖时半径需要达到画布对角线的一半，不能只到短边。':'保持中心固定，避免误变成单边擦除。'}`),'逐帧对照并补中间关键帧，核对边界、速度和羽化。若当前版本不支持蒙版尺寸关键帧，需按版本核对蒙版关键帧支持，或选同方向的对开/扩展转场预设再调时长；压平参考片不能提供被遮住的完整原素材。']});
 }
 return out;
}
