// One shared lock for media operations across editor, breakdown and teaching modules.
let active=null;
export function claimMediaTask(label){
 if(active)throw Error(`正在${active.label}，请等待或取消后再操作`);
 const token={label};active=token;let released=false;
 return ()=>{if(!released&&active===token)active=null;released=true};
}
export function mediaTaskLabel(){return active?.label||''}
