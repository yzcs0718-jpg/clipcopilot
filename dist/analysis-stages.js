export async function runAnalysisStages(stages,onStage=()=>{}){for(let index=0;index<stages.length;index++){try{onStage(index,stages[index]);if(await stages[index].run()!==true)return{complete:false,index}}catch(error){return{complete:false,index,error}}}return{complete:true}}

// Independent checks can fail without suppressing the remaining checks. A user
// cancellation stops the whole run; segmentation is the only required stage.
export async function runReferenceStages(stages,onUpdate=()=>{},shouldStop=()=>false){
 const results=[];
 for(let index=0;index<stages.length;index++){
  if(shouldStop())return{complete:false,cancelled:true,results};
  const stage=stages[index];onUpdate(index,'running');let result;
  try{const ok=await stage.run();result={title:stage.title,ok:ok===true,message:stage.message?.()||''}}
  catch(error){result={title:stage.title,ok:false,message:error.message||String(error)}}
  results.push(result);onUpdate(index,result.ok?'done':'failed',result.message);
  if(shouldStop())return{complete:false,cancelled:true,results};
  if(!result.ok&&stage.required)return{complete:false,cancelled:false,results};
 }
 return{complete:results.every(r=>r.ok),cancelled:false,results};
}

export async function cachedCheck(force,complete,run,onReuse=()=>{}){if(!force&&complete){onReuse();return true}return await run()}

export function referenceCompletion(result,shortComplete=true){
 const done=result.results.filter(r=>r.ok).length,complete=result.complete&&shortComplete;
 const message=result.cancelled?`分析已停止，已完成 ${done}/3 项。已完成的证据保留，可点击“开始 / 继续拉片”重试。`:result.complete&&!shortComplete?'三项基础检查已运行，但短效果补查仅部分完成。已有步骤可查看；点击“开始 / 继续拉片”补查剩余区间。':complete?'三项检查已完成。下方直接查看时间点、实测证据和剪映试做步骤。':`已完成 ${done}/3 项。未完成的原因已列在上方，其余结果已保留；可单独重试失败步骤。`;
 return{complete,message};
}
