function normalized(frame){const p=frame.pixels,a=[];let mean=0;for(let i=0;i<p.length;i+=3){const v=(.2126*p[i]+.7152*p[i+1]+.0722*p[i+2])/255;a.push(v);mean+=v}mean/=a.length;const sd=Math.sqrt(a.reduce((n,v)=>n+(v-mean)**2,0)/a.length);return {a,sd}}
export function estimateTranslation(a,b,width,height){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<16||height<16||width>128||height>128||a.length!==width*height||b.length!==a.length)return null;
 const mx=Math.floor(width*.2),my=Math.floor(height*.2),error=(dx,dy)=>{let sum=0,n=0;for(let y=my+1;y<height-my-1;y+=2)for(let x=mx+1;x<width-mx-1;x+=2){sum+=Math.min(2,Math.abs(a[(y-dy)*width+x-dx]-b[y*width+x]));n++}return n?sum/n:Infinity};
 const baseline=error(0,0);let best={error:Infinity,dx:0,dy:0};const fits=[];for(let dy=-my;dy<=my;dy++)for(let dx=-mx;dx<=mx;dx++){const fit={error:error(dx,dy),dx,dy};fits.push(fit);if(fit.error<best.error)best=fit}
 const alternative=Math.min(...fits.filter(f=>Math.hypot(f.dx-best.dx,f.dy-best.dy)>=3).map(f=>f.error));return {...best,baseline,improvement:baseline>0?(baseline-best.error)/baseline:0,margin:alternative-best.error};
}
export function detectPanEffects(samples,shot){
 const f=samples.filter(f=>f.time>=shot.start&&f.time<shot.end&&f.pixels?.length&&f.pixelWidth&&f.pixelHeight).sort((a,b)=>a.time-b.time);if(f.length<5)return[];
 const chosen=Array.from({length:5},(_,i)=>f[Math.round(i*(f.length-1)/4)]),a=chosen[0],end=chosen.at(-1),duration=end.time-a.time;if(duration<.6)return[];
 if(chosen.some((f,i)=>f.pixelWidth!==a.pixelWidth||f.pixelHeight!==a.pixelHeight||i&&f.time-chosen[i-1].time>duration*.45))return[];
 const images=chosen.map(normalized);if(images.some(f=>f.sd<.09))return[];
 const fits=images.slice(1).map(f=>estimateTranslation(images[0].a,f.a,a.pixelWidth,a.pixelHeight));if(fits.some(f=>!f||f.error>.08||f.margin<.012))return[];
 const last=fits.at(-1),length=Math.hypot(last.dx,last.dy);if(length<3||last.improvement<.55)return[];
 let previous=0;for(let i=0;i<fits.length;i++){const fit=fits[i],along=(fit.dx*last.dx+fit.dy*last.dy)/(length*length),cross=Math.abs(fit.dx*last.dy-fit.dy*last.dx)/length,expected=(chosen[i+1].time-a.time)/duration;if(along<previous-.08||Math.abs(along-expected)>.28||cross>1.5)return[];previous=along}
 const x=last.dx/a.pixelWidth,y=last.dy/a.pixelHeight,axis=Math.abs(x)>=Math.abs(y)?'横移':'纵移',direction=`${Math.abs(x)>=.015?(x>0?'向右':'向左')+Math.abs(x*100).toFixed(1)+'%':''}${Math.abs(y)>=.015?' '+(y>0?'向下':'向上')+Math.abs(y*100).toFixed(1)+'%':''}`.trim();
 const keyframes=[{time:a.time,x:0,y:0},...fits.map((fit,i)=>({time:chosen[i+1].time,x:fit.dx/a.pixelWidth,y:fit.dy/a.pixelHeight}))];
 return [{kind:'pan',start:a.time,end:end.time,title:`画面${axis} / 位置关键帧候选`,preview:{kind:'pan',x,y,keyframes},stepTimes:[...keyframes.map(node=>node.time),end.time,end.time],parameters:`相对起始画面位移：${direction}（占画面宽 / 高）；按 5 个采样位置估计`,reason:'对齐首帧与后续四个采样后，整体平移匹配明显改善，位移方向连续；也可能是实拍摇移或平面主体运动，不能证明使用了位置关键帧。',steps:[`在剪映中选中素材，定位 ${a.time.toFixed(3)} 秒，打开画面位置参数并添加起始关键帧，记下当前 X / Y。`,...keyframes.slice(1).map(node=>`到 ${node.time.toFixed(3)} 秒添加位置关键帧：相对起点的位置变化约为画面${node.x>=0?'向右':'向左'} ${(Math.abs(node.x)*100).toFixed(1)}% 画布宽、${node.y>=0?'向下':'向上'} ${(Math.abs(node.y)*100).toFixed(1)}% 画布高；拖动画面对齐参考，按画面方向校准。`),'回到中间时刻核对固定背景：先尝试线性位置变化；需要时补中间关键帧。适当放大素材留出移动余量，避免画面边缘露黑。','如果前后景出现不同程度的位移或视差，位置关键帧只能近似；请保留实拍运动，不把主体移动当成整层位移。']}];
}
