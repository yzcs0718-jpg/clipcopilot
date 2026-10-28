import {modelSkill} from './github-skills-state.js?v=20261027motion';
import {localCreativeTask} from './app.js?v=20261027motion';
import {localReferenceTask,effectReferenceTask} from './breakdown.js?v=20261028effects2';
const $=id=>document.getElementById(id),token=document.querySelector('meta[name="clippilot-local-token"]')?.content;
const isLocal=token&&['127.0.0.1','localhost'].includes(location.hostname)&&location.protocol==='http:';
if(isLocal){$('local-ai-controls').hidden=false;$('local-ai-status').textContent='本地版已打开。先点击读取模型；如果没有模型，按说明安装本地视觉模型。不使用云模型。'}
async function request(path,data,signal){if(!isLocal)throw Error('请下载并启动本地版，公开站点不访问你的电脑模型');const r=await fetch(path,{method:data?'POST':'GET',headers:{'Content-Type':'application/json','X-ClipPilot-Local':token},body:data?JSON.stringify(data):undefined,signal:signal?AbortSignal.any([signal,AbortSignal.timeout(210000)]):AbortSignal.timeout(210000)});const result=await r.json();if(!r.ok)throw Error(result.error||'本地模型请求失败');return result}
$('local-ai-load').onclick=async()=>{try{$('local-ai-load').disabled=true;const data=await request('/api/local/models');$('local-ai-model').replaceChildren();for(const model of data.models){const op=document.createElement('option');op.value=model.name;op.textContent=`${model.name} · ${(model.size/1e9).toFixed(1)}GB`;$('local-ai-model').append(op)}$('local-ai-status').textContent=data.models.length?'已列出本地权重；运行时还会核对视觉能力。模型名称不保证效果。':'未找到本地模型权重；不会自动下载或切换云服务。'}catch(e){$('local-ai-status').textContent=e.message}finally{$('local-ai-load').disabled=false}};
$('local-ai-create').onclick=async()=>{try{const model=$('local-ai-model').value;if(!model)throw Error('请先读取并选择本地视觉模型');const skill=modelSkill();const result=await localCreativeTask(context=>request('/api/local/creative',{...context,model,skill}));$('local-ai-output').textContent=result.summary+'\n'+result.method;$('local-ai-status').textContent='已生成可编辑时间线。检查后使用原有导出按钮。'}catch(e){$('local-ai-status').textContent='未采用新方案：'+e.message}};
$('local-ai-analyze').onclick=async()=>{try{const model=$('local-ai-model').value;if(!model)throw Error('请先读取并选择本地视觉模型');const skill=modelSkill();const result=await localReferenceTask(context=>request('/api/local/analyze',{...context,model,skill}));$('local-ai-output').textContent=result.analysis;$('local-ai-status').textContent='分析已加入拉片报告；仍需核对推断。'}catch(e){$('local-ai-status').textContent=e.message}};

$('local-ai-shortcut').onclick=()=>{$('local-ai-panel').scrollIntoView({behavior:'smooth',block:'start'})};

let effectAbort=null;
$('effect-cancel').onclick=()=>effectAbort?.abort();
$('effect-analyze').onclick=async()=>{try{
 if(!isLocal)throw Error('视觉深析需要本地模型。请下载最新本地版源码，按启动说明开启模型；公开版不会调用收费 API。');
 const model=$('local-ai-model').value;if(!model)throw Error('请在顶部“本地 AI”中读取并选择已安装的视觉模型，再回来分析。');
 effectAbort=new AbortController();const signal=effectAbort.signal,skill=modelSkill();await effectReferenceTask(context=>request('/api/local/analyze',{...context,model,skill},signal),signal);
 }catch(error){$('effect-status').textContent=error.name==='AbortError'?'已停止分析；已完成的镜头结果可下载。':'分析未完成：'+error.message}finally{effectAbort=null}};
