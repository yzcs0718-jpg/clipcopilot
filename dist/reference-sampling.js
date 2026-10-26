export function isPixelArray(value){return Array.isArray(value)||value instanceof Uint8Array||value instanceof Uint8ClampedArray}
export function referenceSampleTimes(duration,fps=24,maxFrames=3600){
 if(!Number.isFinite(duration)||duration<=0||duration>600)throw Error('请选择 10 分钟内的视频');
 if(![6,24].includes(fps)||!Number.isInteger(maxFrames)||maxFrames<4||maxFrames>3600)throw Error('无效采样设置');
 const count=Math.min(maxFrames,Math.max(4,Math.ceil(duration*fps)+1));return Array.from({length:count},(_,i)=>Math.max(0,Math.min(duration-.001,i*duration/(count-1))));
}
