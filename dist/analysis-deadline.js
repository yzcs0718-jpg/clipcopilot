export function modelBudget(mode){return mode==='extended'?300000:45000}
export function analysisDeadline(ms,onExpire){
 if(!Number.isFinite(ms)||ms<=0)throw Error('无效分析时限');
 let expired=false,closed=false;
 const timer=setTimeout(()=>{if(closed)return;expired=true;closed=true;onExpire()},ms);
 return{get expired(){return expired},close(){closed=true;clearTimeout(timer)}};
}
