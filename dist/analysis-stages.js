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
