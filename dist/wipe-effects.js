const diff=(a,b)=>{let s=0;for(let i=0;i<a.length;i++)s+=Math.abs(a[i]-b[i]);return s/a.length/255};
const contrast=a=>{let m=0;for(const v of a)m+=v;m/=a.length;let s=0;for(const v of a)s+=(v-m)**2;return Math.sqrt(s/a.length)/255};
// Fit one straight moving boundary against two observed, stable endpoint images.
export function fitWipe(a,b,f,w,h){
 if(w<16||h<16||w>128||h>128||a.length!==w*h*3||b.length!==a.length||f.length!==a.length)return null;
 let best={error:Infinity};
 for(const axis of ['x','y']){const n=axis==='x'?w:h,A=new Float64Array(n),B=new Float64Array(n);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=axis==='x'?x:y;for(let c=0;c<3;c++){const i=(y*w+x)*3+c;A[k]+=Math.abs(f[i]-a[i]);B[k]+=Math.abs(f[i]-b[i])}}
  let leftA=0,leftB=0;const allA=A.reduce((s,v)=>s+v,0),allB=B.reduce((s,v)=>s+v,0);
  for(let k=0;k<=n;k++){for(const fromStart of [true,false]){const cost=fromStart?leftB+allA-leftA:leftA+allB-leftB,error=cost/a.length/255;if(error<best.error)best={axis,fromStart,progress:fromStart?k/n:1-k/n,error}}
   if(k<n){leftA+=A[k];leftB+=B[k]}
  }
 }return best;
}
export function detectWipes(samples){
 const f=samples.filter(f=>Number.isFinite(f.time)&&f.pixelWidth&&f.pixelHeight&&f.pixels?.length).sort((a,b)=>a.time-b.time),out=[];
 for(let i=2;i<f.length-8;i++)for(let span=6;span<=16&&i+span+2<f.length;span++){
  const range=f.slice(i,i+span+1),a=range[0],b=range.at(-1),duration=b.time-a.time,w=a.pixelWidth,h=a.pixelHeight;
  if(duration<.5||duration>2.7||range.some((p,j)=>p.pixelWidth!==w||p.pixelHeight!==h||p.pixels.length!==a.pixels.length||j&&p.time-range[j-1].time>duration*.24)||diff(f[i-2].pixels,a.pixels)>.01||diff(b.pixels,f[i+span+2].pixels)>.01||diff(a.pixels,b.pixels)<.13||contrast(a.pixels)<.1||contrast(b.pixels)<.1)continue;
  if(out.some(e=>Math.min(e.end,b.time)>Math.max(e.start,a.time)))continue;
  if(range.slice(1,-1).filter(p=>diff(p.pixels,a.pixels)>.02&&diff(p.pixels,b.pixels)>.02).length<3)continue;
  const fits=range.map(p=>({...fitWipe(a.pixels,b.pixels,p.pixels,w,h),time:p.time})),mid=fits.filter(p=>p.progress>.08&&p.progress<.92);if(mid.length<3)continue;
  const model=mid[Math.floor(mid.length/2)];let previous=0,valid=true;
  for(const p of fits){if(p.error>.025||p.progress<previous-.055||p.progress>.08&&p.progress<.92&&(p.axis!==model.axis||p.fromStart!==model.fromStart)){valid=false;break}previous=p.progress}
  if(!valid||mid.at(-1).progress-mid[0].progress<.4||!mid.some(p=>p.progress>.35&&p.progress<.65))continue;
  const lo=Math.max(0,fits.findIndex(p=>p.progress>.025)-1),hi=Math.min(fits.length-1,fits.findLastIndex(p=>p.progress<.975)+1),start=range[lo].time,end=range[hi].time;if(out.some(e=>Math.min(e.end,end)>Math.max(e.start,start)))continue;
  const from=model.axis==='x'?(model.fromStart?'左':'右'):(model.fromStart?'上':'下'),to=model.axis==='x'?(model.fromStart?'右':'左'):(model.fromStart?'下':'上'),keyframes=fits.slice(lo,hi+1).map(p=>({time:p.time,progress:p.progress})),nodes=[keyframes[0],...mid.filter((_,i)=>i===Math.floor(mid.length/2)),keyframes.at(-1)];
  out.push({kind:'wipe',start,end,title:`${model.axis==='x'?'横向':'纵向'}擦除 / 线性蒙版候选`,preview:{kind:'wipe',axis:model.axis,fromStart:model.fromStart,keyframes},parameters:`后画面从${from}向${to}显露；边界移动 ${start.toFixed(3)}–${end.toFixed(3)} 秒（约 ${(end-start).toFixed(3)} 秒）`,reason:'多个中间帧可由两幅稳定端点画面沿一条横/竖直边界替换近似，边界方向连续；也可能是实物遮挡或其他遮罩实现。不判断具体转场预设；曲线边缘、大羽化、移动素材及复杂遮挡可能漏检。',stepTimes:[start,start,...nodes.map(n=>n.time),end],steps:[`在剪映定位 ${start.toFixed(3)}–${end.toFixed(3)} 秒，将前画面放底层、后画面放上层，重叠约 ${(end-start).toFixed(3)} 秒。`,`选中上层后画面，进入“蒙版”，选择“线性”；让分界线${model.axis==='x'?'竖直':'水平'}，保留${from}侧的后画面，方向相反时使用反转或旋转蒙版。羽化先设为 0，再对照原片微调。`,...nodes.map(n=>`到 ${n.time.toFixed(3)} 秒给蒙版位置添加关键帧：让后画面从${from}侧显露约 ${(n.progress*100).toFixed(0)}% 的画面${model.axis==='x'?'宽度':'高度'}，分界线逐渐向${to}移动。`),'线性播放并逐帧核对边界速度与羽化。压平的参考片不含完整上下层素材，请另备前后两段素材；不要移动整张后画面代替移动蒙版边界。']});
 }
 return out;
}
