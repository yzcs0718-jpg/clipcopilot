export function isPixelArray(value){return Array.isArray(value)||value instanceof Uint8Array||value instanceof Uint8ClampedArray}
export function referenceSampleTimes(duration,fps=24,maxFrames=3600){
 if(!Number.isFinite(duration)||duration<=0||duration>600)throw Error('请选择 10 分钟内的视频');
 if(![6,24].includes(fps)||!Number.isInteger(maxFrames)||maxFrames<4||maxFrames>3600)throw Error('无效采样设置');
 const count=Math.min(maxFrames,Math.max(4,Math.ceil(duration*fps)+1));return Array.from({length:count},(_,i)=>Math.max(0,Math.min(duration-.001,i*duration/(count-1))));
}
// Bounded local inspection: never dilute the whole-video sampling grid.
export function shortEffectTimes(duration,start,end,fps=120){
 if(!Number.isFinite(duration)||duration<=0||duration>600||!Number.isFinite(start)||!Number.isFinite(end)||start<0||end>duration||end<=start||end-start>4||![60,120].includes(fps))throw Error('精查区间须在视频内，每次最多 4 秒');
 const count=Math.min(480,Math.max(3,Math.ceil((end-start)*fps)+1));
 return Array.from({length:count},(_,i)=>Math.max(0,Math.min(duration-.001,start+i*(end-start)/(count-1))));
}
