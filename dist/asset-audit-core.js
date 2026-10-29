import {sha256} from './sha256.js?v=20261029audit4';
const FULL_LIMIT=8*1024*1024,PART=256*1024,cache=new WeakMap();
export async function fingerprintFile(file){
 if(!file||!Number.isFinite(file.size)||file.size<0||typeof file.arrayBuffer!=='function')throw Error('无法读取文件内容');
 if(cache.has(file))return cache.get(file);
 const task=(async()=>{const mode=file.size<=FULL_LIMIT?'full':'sample';let bytes;
  if(mode==='full')bytes=await file.arrayBuffer();else{const starts=[0,Math.max(0,Math.floor(file.size/2)-PART/2),Math.max(0,file.size-PART)],pieces=await Promise.all(starts.map(start=>file.slice(start,Math.min(file.size,start+PART)).arrayBuffer()));bytes=new Uint8Array(pieces.reduce((n,p)=>n+p.byteLength,0));let offset=0;for(const p of pieces){bytes.set(new Uint8Array(p),offset);offset+=p.byteLength}}
  const digest=globalThis.crypto?.subtle?new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes)):sha256(bytes);
  const hash=Array.from(digest,v=>v.toString(16).padStart(2,'0')).join('');return{key:mode+':'+file.size+':'+hash,mode,size:file.size};})();cache.set(file,task);try{return await task}catch(e){cache.delete(file);throw e}
}
export async function fingerprintAssets(assets,onProgress=()=>{}){const results=[];for(let i=0;i<assets.length;i++){onProgress(i+1,assets.length,assets[i].name);try{results.push(await fingerprintFile(assets[i].file))}catch(error){results.push({error:error.message||'内容比对未完成'})}}return results}
export function auditAssets(assets,plan={clips:[]},ratio='16:9',fingerprints=[]){
 if(!Array.isArray(assets)||!Array.isArray(plan?.clips))throw Error('素材或时间线格式无效');
 const issues=[],groups=new Map(),names=new Map(),used=new Set(),orientations=new Set(),target=ratio==='9:16'?9/16:ratio==='1:1'?1:16/9;
 let seconds=0,bytes=0,unknownSizes=0;
 const add=(code,message,indices=[],level='review')=>issues.push({code,message,indices,level});
 assets.forEach((a,i)=>{if(Number.isFinite(a.duration)&&a.duration>0)seconds+=a.duration;else add('duration','素材时长无效，需重新导入。',[i]);if(Number.isFinite(a.file?.size))bytes+=a.file.size;else unknownSizes++;
  if(a.width>0&&a.height>0){const r=a.width/a.height,orientation=r>1.05?'横屏':r<.95?'竖屏':'近方形';orientations.add(orientation);if(Math.min(a.width,a.height)<480)add('low-resolution',`短边只有 ${Math.min(a.width,a.height)} 像素，放大前检查清晰度；放大不会补回真实细节。`,[i]);if(Math.abs(Math.log(r/target))>.08)add('ratio',`与成片 ${ratio} 画幅不同，预览主体位置和背景填充，避免裁掉重要内容。`,[i])}else add('dimensions','未读到有效画面尺寸，请重新导入。',[i]);
  if(a.duration>0&&a.duration<.5)add('short-source','素材短于0.5秒，检查是否为误导入或仅作闪帧使用。',[i]);
  const name=String(a.name||'未命名素材');if(!names.has(name))names.set(name,[]);names.get(name).push(i);const p=fingerprints[i];if(p?.key){if(!groups.has(p.key))groups.set(p.key,[]);groups.get(p.key).push(i)}else if(p?.error)add('fingerprint-unavailable','内容比对未完成：'+p.error,[i],'note');
 });
 if(orientations.size>1)add('mixed-orientation','项目混用了不同画面方向，请在成片预览中检查构图。',[], 'note');
 for(const indices of names.values())if(indices.length>1)add('same-name','存在重名素材；重名不代表内容相同，按预览和内容比对结果核对。',indices,'note');
 const duplicates=[];for(const [key,indices]of groups)if(indices.length>1){const mode=key.startsWith('full:')?'full':'sample';duplicates.push({indices,mode});add('duplicate',mode==='full'?'文件字节完全相同（完整SHA-256比对），可核对是否重复导入。':'疑似重复：大小与头/中/尾抽样一致，尚未完整比对，请预览确认。',indices)}
 let outputSeconds=0;plan.clips.forEach((c,i)=>{if(!Number.isInteger(c.asset)||!assets[c.asset]){add('invalid-asset',`时间线第${i+1}段引用的素材不存在。`);return}used.add(c.asset);if(!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<0||c.end<=c.start||c.end>assets[c.asset].duration+.001)add('invalid-range',`时间线第${i+1}段超出素材或起止时间无效。`,[c.asset]);else{outputSeconds+=c.end-c.start;if(c.end-c.start<.25)add('short-clip',`时间线第${i+1}段短于0.25秒，预览时核对是否闪得过快。`,[c.asset],'note')}});
 const unused=assets.map((a,i)=>i).filter(i=>!used.has(i));if(plan.clips.length&&unused.length)add('unused',`${unused.length}条素材尚未入选，可增加目标时长或在时间线手动添加。`,unused,'note');
 const priority={duplicate:0,'invalid-asset':1,'invalid-range':1,'mixed-orientation':2};issues.sort((a,b)=>(priority[a.code]??5)-(priority[b.code]??5));
 return{count:assets.length,seconds,bytes,unknownSizes,outputSeconds,orientations:[...orientations],duplicates,issues,unused,checksPending:assets.length>fingerprints.filter(p=>p?.key||p?.error).length};
}
export function assetAuditReport(audit,assets,ratio){return '# 素材体检清单\n\n'+`${audit.count}条素材，总时长${audit.seconds.toFixed(1)}秒；时间线${audit.outputSeconds.toFixed(1)}秒；成片画幅${ratio}。\n\n`+audit.issues.map((issue,i)=>`${i+1}. ${issue.message}\n   素材：${issue.indices.map(n=>assets[n]?.name||'未知').join('、')||'项目整体'}`).join('\n\n')+'\n\n比对范围：8MB以内做完整SHA-256；较大文件比对大小与头/中/尾各256KB，只能提示疑似重复。转码后同画面不保证识别。这里只检查文件内容、尺寸、时长和当前时间线，不判断剧情、音轨或视觉质量。\n'}
