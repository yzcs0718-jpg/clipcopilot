// Request a real H.264/AAC MP4 encoder. Never rename WebM bytes to .mp4.
export const mp4Types=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4;codecs=avc1,mp4a.40.2','video/mp4'];
export function createMP4Recorder(stream,Recorder=globalThis.MediaRecorder){
 if(!Recorder)throw Error('当前浏览器不支持视频编码，请使用新版 Chrome、Edge 或 Safari');
 const errors=[];
 for(const mimeType of mp4Types){
  if(!Recorder.isTypeSupported(mimeType))continue;
  try{return new Recorder(stream,{mimeType,videoBitsPerSecond:6_000_000,audioBitsPerSecond:128_000})}catch(e){errors.push(e.message)}
 }
 throw Error('当前浏览器无法编码 MP4。请用新版 Chrome、Edge 或 Safari 打开本站后重试；不会下载伪装成 MP4 的 WebM。'+(errors.length?' 编码器：'+errors.join('；'):''));
}
export async function verifyMP4(blob){
 if(blob.size<12)throw Error('MP4 编码结果为空或损坏');
 const bytes=new Uint8Array(await blob.slice(0,12).arrayBuffer());
 if(String.fromCharCode(...bytes.slice(4,8))!=='ftyp')throw Error('编码器未返回有效 MP4 容器，已阻止错误格式下载');
 return blob;
}
