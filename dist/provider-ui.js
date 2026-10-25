const $=id=>document.getElementById(id);
export const providers={
 zhipu:{name:'智谱 GLM',prefix:'ZHIPU',base:'https://open.bigmodel.cn/api/paas/v4',model:'glm-5.3',vision:'glm-4.6v',docs:'https://docs.bigmodel.cn/cn/guide/develop/openai/introduction'},
 kimi:{name:'Kimi',prefix:'KIMI',base:'https://api.moonshot.cn/v1',model:'kimi-k3.1-pro',vision:'kimi-k3.1-pro',docs:'https://platform.kimi.com/docs/get-api-key'},
 deepseek:{name:'DeepSeek',prefix:'DEEPSEEK',base:'https://api.deepseek.com',model:'deepseek-flash',vision:'deepseek-flash',docs:'https://api-docs.deepseek.com/'},
 doubao:{name:'豆包 / 火山方舟',prefix:'DOUBAO',base:'https://ark.cn-beijing.volces.com/api/v3',model:'填写控制台模型 ID 或接入点 ID',vision:'填写支持图片输入的模型 ID 或接入点 ID',docs:'https://www.volcengine.com/docs/82379/1298454'},
 custom:{name:'自定义兼容服务',prefix:'MODEL',base:'填写兼容接口 HTTPS 地址',model:'填写文字模型名称',vision:'填写视觉模型名称',docs:''}
};
let health=null;
export function requireModelCalls(){throw Error('当前为零费用模式，远程模型调用已关闭；请使用本地初稿与拉片报告')}
$('provider-test').disabled=true;$('ai').disabled=true;$('ref-ai').disabled=true;
export function selection(kind){return $(kind==='vision'?'vision-provider':'text-provider').value}
function hint(){
 const id=selection('text')||health?.default_provider||'zhipu',p=providers[id];if(!p)return;
 const prefix=p.prefix,modelKey=id==='custom'?'MODEL_NAME':prefix+'_MODEL',visionKey=id==='custom'?'VISION_MODEL_NAME':prefix+'_VISION_MODEL';
 $('provider-config-example').textContent=`# 在后端环境变量设置，网页不接收模型 API Key\n${prefix}_API_KEY=填入你自己的密钥\n${modelKey}=${p.model}\n${visionKey}=${p.vision}\n# 可选地址覆盖（默认已内置）\n${prefix}_BASE_URL=${p.base}`;
 const a=$('provider-docs');a.hidden=!p.docs;if(p.docs)a.href=p.docs;
 const describe=kind=>{const selected=selection(kind)||health?.default_provider;const data=health?.providers?.find(p=>p.id===selected);const name=providers[selected]?.name||'后端默认';return `${kind==='text'?'文字':'视觉'}：${name} · ${data?(kind==='vision'?data.vision_configured:data.configured)?'已配置，真实调用待验证':'后端尚未配置':'待检测后端配置'}`};
 $('provider-status').textContent='零费用模式 · 远程模型调用已关闭。'+describe('text')+'；'+describe('vision');
}
for(const kind of ['text','vision']){
 const select=$(kind+'-provider');const auto=document.createElement('option');auto.value='';auto.textContent='使用后端默认';select.append(auto);
 for(const [id,p] of Object.entries(providers)){const op=document.createElement('option');op.value=id;op.textContent=p.name;select.append(op)}
 select.onchange=()=>{hint();$('api-state').textContent='服务商预设已更新。当前零费用模式不会调用远程模型。'};
}
export function showHealth(data){health=data;hint();return Array.isArray(data.providers)}
export function apiBase(){
 if(!$('api').value.trim()||!$('token').value)throw Error('请先填写后端地址和访问令牌');
 const u=new URL($('api').value.trim());if(u.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(u.hostname))throw Error('公开后端必须使用 HTTPS');return u.origin;
}
$('provider-test').onclick=async()=>{
 try{requireModelCalls();const base=apiBase();$('provider-test').disabled=true;$('api-state').textContent='正在测试文字模型，会发送一条固定测试消息，不发送视频或文案…';
 const response=await fetch(base+'/api/test',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+$('token').value},body:JSON.stringify({provider:selection('text')}),signal:AbortSignal.timeout(65000)});
 const data=await response.json();if(!response.ok)throw Error(data.error||'文字模型测试失败');$('api-state').textContent=`文字模型实测成功：${providers[data.provider]?.name||data.provider} / ${data.model}。视觉模型请通过一次 AI 深入解读另行检查。`;
 }catch(e){$('api-state').textContent='模型测试未成功：'+e.message}finally{$('provider-test').disabled=true}
};
for(const id of ['api','token'])$(id).addEventListener('input',()=>{health=null;hint();$('api-state').textContent='后端地址或访问令牌已改变，请重新检测。'});
hint();
