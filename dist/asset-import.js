function metadata(video,timeout=15000){return new Promise((resolve,reject)=>{const cleanup=()=>{clearTimeout(timer);video.removeEventListener('loadedmetadata',ok);video.removeEventListener('error',bad)},ok=()=>{cleanup();resolve()},bad=()=>{cleanup();reject(Error('浏览器无法读取这个视频；可能不支持其编码，请尝试 H.264 视频、AAC 音频的 MP4'))};const timer=setTimeout(()=>{cleanup();reject(Error('读取视频超时，请检查文件完整性或换用浏览器可播放的 MP4'))},timeout);video.addEventListener('loadedmetadata',ok,{once:true});video.addEventListener('error',bad,{once:true})})}
export async function prepareAssets(files,{existingCount=0,mode='replace',origin='user',onProgress=()=>{},createVideo=()=>document.createElement('video'),createURL=f=>URL.createObjectURL(f),revokeURL=u=>URL.revokeObjectURL(u)}={}){
 const input=Array.from(files||[]);if(!['replace','append'].includes(mode))throw Error('请选择有效的导入方式');if(input.length+(mode==='append'?existingCount:0)>100)throw Error('每个项目最多 100 个素材');if(!input.length)return [];
 const pending=[];try{for(let i=0;i<input.length;i++){const file=input[i];if(file.size===0)throw Error('文件为空：'+file.name);onProgress(i+1,input.length,file.name);const video=createVideo(),url=createURL(file);pending.push({name:file.name,url,origin});video.preload='metadata';try{const ready=metadata(video);video.src=url;await ready;if(!Number.isFinite(video.duration)||video.duration<=0||video.duration>=86400)throw Error('请选择有效且小于 24 小时的视频');if(!video.videoWidth||!video.videoHeight)throw Error('未读取到视频画面；请检查是否为音频文件或不支持的视频编码');Object.assign(pending.at(-1),{duration:video.duration,width:video.videoWidth,height:video.videoHeight})}finally{video.removeAttribute('src');video.load()}}
 return pending}catch(e){pending.forEach(a=>revokeURL(a.url));throw e}
}
export function composeImport(current,pending,mode='replace'){
 if(!['replace','append'].includes(mode)||!Array.isArray(pending)||!pending.length)throw Error('没有可导入的视频');const startIndex=mode==='append'?current.assets.length:0;
 return {assets:mode==='append'?[...current.assets,...pending]:[...pending],plan:mode==='append'?structuredClone(current.plan):{clips:[]},startIndex,added:pending.length};
}
export function appendBasicClips(plan,assets,startIndex,seconds=5){
 if(!Number.isFinite(seconds)||seconds<1||seconds>60)throw Error('每段时长需为 1–60 秒');const additions=assets.slice(startIndex).map((a,i)=>({asset:startIndex+i,start:0,end:Math.min(seconds,a.duration),caption:'',effect:'none'}));if(plan.clips.length+additions.length>100)throw Error('素材已导入，但时间线超过 100 段；请减少片段后生成');return {...structuredClone(plan),clips:[...structuredClone(plan.clips),...additions]};
}

export function importAction({mode='replace',auto=true,rebuildAppend=false,hasClips=false}={}){
 if(!['replace','append'].includes(mode))throw Error('请选择有效的导入方式');
 if(mode==='append'&&hasClips&&!rebuildAppend)return 'append';
 return auto||rebuildAppend&&mode==='append'?'rebuild':'append';
}
