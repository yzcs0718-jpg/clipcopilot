const platforms=[['抖音',['douyin.com','iesdouyin.com']],['小红书',['xiaohongshu.com','xhslink.com']],['B站',['bilibili.com','b23.tv']]];
export function sourceLink(value){
 if(value!==undefined&&value!==null&&(typeof value!=='string'||value.length>2000))throw Error('来源链接无效或过长');
 if(!value?.trim())return {url:'',platform:'本地参考视频'};
 let u;try{u=new URL(value.trim())}catch{throw Error('请输入完整的 HTTPS 作品或账号链接')}
 if(u.protocol!=='https:'||u.username||u.password)throw Error('来源链接必须为 HTTPS，且不能含账号密码');
 const match=platforms.find(([,hosts])=>hosts.some(host=>u.hostname===host||u.hostname.endsWith('.'+host)));if(!match)throw Error('仅记录抖音、小红书或 B站官方域名链接');
 u.hash='';return {url:u.href,platform:match[0]};
}
export function validateStyleProfile(p){
 if(!p||p.version!==1||typeof p.creator!=='string'||!p.creator.trim()||p.creator.length>80||typeof p.sourceName!=='string'||p.sourceName.length>500)throw Error('参考风格资料无效');
 sourceLink(p.url);
 if(p.sources!==undefined){if(!Array.isArray(p.sources)||!p.sources.length||p.sources.length>20)throw Error('参考来源列表无效');for(const s of p.sources){if(!s||typeof s.creator!=='string'||s.creator.length>80||typeof s.sourceName!=='string'||s.sourceName.length>500)throw Error('来源资料无效');sourceLink(s.url)}}
 if(!Array.isArray(p.seconds)||!p.seconds.length||p.seconds.length>40||!p.seconds.every(x=>Number.isFinite(x)&&x>=.6&&x<=8))throw Error('参考节奏资料无效');
 if(!Array.isArray(p.effects)||p.effects.length!==p.seconds.length||!p.effects.every(x=>['none','push','fade'].includes(x)))throw Error('参考效果资料无效');
 return p;
}
export function makeReferenceStyle({creator,url,reference,shots}){
 if(!reference||!Array.isArray(shots)||!shots.length||shots.length>40)throw Error('请先上传参考视频并完成拉片');
 const name=creator.trim();if(!name||name.length>80)throw Error('请填写博主名或素材来源（最多 80 字）');
 if(typeof reference.name!=='string'||reference.name.length>500||!Number.isFinite(reference.duration)||reference.duration<=0)throw Error('参考视频信息无效');
 const link=sourceLink(url),map={'缓慢推近':'push','叠化 / 淡入淡出':'fade'};
 const observations=shots.map((s,i)=>{if(!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.start<0||s.end<=s.start||s.end>reference.duration+.01)throw Error('请核对参考镜头的时间区间');return {shot:i+1,start:s.start,end:s.end,effect:s.effect,note:String(s.note||'').slice(0,1000)}});
 return validateStyleProfile({version:1,creator:name,creatorVerified:false,platform:link.platform,url:link.url,sourceName:reference.name,method:'本地候选节奏 + 人工校正的复现方式',seconds:observations.map(s=>Math.max(.6,Math.min(8,s.end-s.start))),effects:observations.map(s=>map[s.effect]||'none'),observations});
}
export function attribution(profile){return profile?`参考博主 / 来源：${profile.creator}（用户填写，未核验账号身份）；素材：${profile.sourceName}；采用候选镜头节奏及推近 / 淡入淡出规则，不能视为完整风格还原。${profile.url?' 原链接：'+profile.url:''}${profile.sources?' 来源作品：'+profile.sources.map(s=>s.sourceName+(s.url?' '+s.url:'')).join('；'):''}`:'当前使用内置剪辑规则，未模仿特定博主。'}

export function combineProfiles(profiles){
 if(!Array.isArray(profiles)||profiles.length<2||profiles.length>10)throw Error('请选择 2–10 份参考节奏');profiles.forEach(validateStyleProfile);
 if(profiles.some(p=>p.creator!==profiles[0].creator))throw Error('请先选择同一来源名的作品；来源名仍需你核对');
 const raw=profiles.flatMap(p=>p.sources||[{creator:p.creator,url:p.url,sourceName:p.sourceName}]);const sources=raw.filter((p,i,a)=>a.findIndex(x=>x.url===p.url&&x.sourceName===p.sourceName)===i);if(sources.length>20)throw Error('合并后超过 20 份来源，请减少选择');
 const slots=Math.min(12,Math.max(...profiles.map(p=>p.seconds.length))),seconds=[],effects=[];
 for(let i=0;i<slots;i++){const picks=profiles.map(p=>Math.min(p.seconds.length-1,Math.floor((i+.5)*p.seconds.length/slots))),values=profiles.map((p,j)=>p.seconds[picks[j]]).sort((a,b)=>a-b);seconds.push(values.length%2?values[Math.floor(values.length/2)]:(values[values.length/2-1]+values[values.length/2])/2);const votes=profiles.map((p,j)=>p.effects[picks[j]]);effects.push(['none','push','fade'].sort((a,b)=>votes.filter(v=>v===b).length-votes.filter(v=>v===a).length)[0])}
 return validateStyleProfile({version:1,creator:profiles[0].creator,creatorVerified:false,url:'',platform:'多作品统计',sourceName:`${sources.length} 份作品 · 节奏统计`,sources,seconds,effects,method:'按相对位置计算时长中位数与效果多数；不是完整风格识别'});
}
