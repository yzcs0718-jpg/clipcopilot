import {detectVisualEffects} from './visual-effects.js?v=20261027motion';
export const lessons={
 '硬切 / 节奏切换':{steps:['导入并定位：把参考镜头对应素材放到主轨，找到动作或句意结束的位置。','分割与取舍：在播放头处分割，删去重复或停顿的区间，把片段首尾贴齐。','核对节奏：连续播放切口，确认动作与句意完整；不需要为每个切口添加转场。'],parameter:'试做：先保持原速，动作结束处直接切换',check:'观察是否跳轴、动作是否突兀；这只是硬切示意。'},
 '缓慢推近':{steps:['添加起点：选中素材，把播放头放到镜头开始，在缩放或位置参数旁添加关键帧。','设置终点：移到镜头结尾，把缩放从 100% 调到约 108%，调整位置保持主体居中。','播放核对：查看主体是否被裁切、速度是否自然；按画面内容调整缩放幅度。'],parameter:'试做：缩放 100% → 108%，主体居中',check:'也可能是实拍推镜头，不能仅凭抽帧断定用了关键帧。'},
 '叠化 / 淡入淡出':{steps:['准备片段：把两个素材放在主轨相邻位置；单段淡入淡出也可以用不透明度关键帧。','设置过渡：打开切口的转场入口尝试叠化，或在片段首尾设置不透明度变化。','缩短并核对：先尝试约 0.2–0.4 秒，播放切口，避免主体重影过久。'],parameter:'试做：0.2–0.4 秒淡入淡出；动画展示单段透明度变化',check:'叠化和淡入淡出不是同一种过渡；需结合前后画面区分。'},
 '重点字幕':{steps:['新建文字：文本 → 新建文本，把实际口播或需要强调的内容按句子拆开。','突出重点：只对关键字调整颜色、字号或粗细，放在主体以外并留安全边距。','校正时机：把字幕入点、出点对齐口播或动作，逐句核对，避免遮挡主体。'],parameter:'试做：重点词用一种强调色；短入场约 0.15–0.25 秒',check:'示意文字不是原视频字幕；请使用你的实际文案。'},
 '快慢变速':{steps:['定位动作：先找到动作开始、高潮与结束的位置；抽帧不能确定原片速度。','绘制速度曲线：选中片段 → 变速 → 曲线变速或自定义，添加速度变化点。','回放调整：试做 1× → 2× → 0.7× → 1×，核对动作和音乐节拍；低帧率减速可能卡顿。'],parameter:'曲线示意：1× → 2× → 0.7× → 1×',check:'静帧不能证明使用了变速；本视频展示曲线示意，未重建原始运动。'},
 '画中画 / 细节叠加':{steps:['准备轨道：主画面放主轨，把细节素材放上方叠加轨；手机端通常叫画中画。','调整窗口：设置缩放与位置，按需要加矩形蒙版，给主体和字幕留出空间。','对齐信息：让细节窗口跟随对应讲解出现，核对遮挡和画面边缘。'],parameter:'试做：主画面 + 右下角细节窗口',check:'示意复用同一参考帧；实际工程应换成你的细节素材。'}
};
export function lessonCheck(shot){return shot.evidence?.startsWith('来自当前工程参数')?'参数来自这条成片的工作台工程；请按源区间定位并核对主体裁切。':(lessons[shot.effect]||lessons['硬切 / 节奏切换']).check}
export function lessonSteps(shot){
 const recipe=lessons[shot.effect]||lessons['硬切 / 节奏切换'];if(shot.effect==='叠化 / 淡入淡出'&&shot.evidence?.includes('单镜头透明度')){const fade=Math.min(.3,(shot.end-shot.start)/2);return [`定位成片 ${shot.start.toFixed(2)}–${shot.end.toFixed(2)} 秒对应片段，打开不透明度；在镜头起点设置 0%。`,`在镜头起点后 ${fade.toFixed(2)} 秒设置 100%；在终点前 ${fade.toFixed(2)} 秒保持 100%，在镜头终点设置 0%。`,`回放核对：这是单镜头透明度变化；本工作台的该效果没有使用两段素材的叠化转场。`]}const range=`${shot.start.toFixed(2)}–${shot.end.toFixed(2)} 秒`;
 return recipe.steps.map((text,i)=>i===0?`对应参考时间 ${range}：${text}`:i===1&&shot.effect==='缓慢推近'?'在该镜头起点添加缩放 100% 关键帧；移动到镜头终点设置约 108%，核对位置使主体保持居中。':text);
}
export function buildLesson(shots,samples,selected='all'){
 const chosen=selected==='all'?shots.map((s,i)=>({...s,index:i})):shots[Number(selected)]?[{...shots[Number(selected)],index:Number(selected)}]:[];
 if(!chosen.length||chosen.length>100||!samples.length)throw Error('请先完成拉片抽帧，并选择有效镜头');
 let cursor=0;return chosen.flatMap(s=>{const recipe=lessons[s.effect]||lessons['硬切 / 节奏切换'];const pic=samples.reduce((a,b)=>Math.abs(b.time-(s.start+s.end)/2)<Math.abs(a.time-(s.start+s.end)/2)?b:a);return lessonSteps(s).map((text,step)=>{const duration=Math.min(12,Math.max(4,Math.ceil(text.replace(/\s/g,'').length/7))),start=cursor;cursor+=duration;return {shot:s.index+1,range:`${s.start.toFixed(2)}–${s.end.toFixed(2)} 秒`,effect:Object.hasOwn(lessons,s.effect)?s.effect:'硬切 / 节奏切换',text,step,parameter:recipe.parameter,check:lessonCheck(s),image:pic.image,start,duration}})});
}
// Use the same measured visual detector as the main audit, rather than a weaker brightness hint.
export function effectHint(samples,shot){
 if(samples.filter(f=>f.time>=shot.start&&f.time<shot.end&&f.pixels?.length).length<3)return {effect:'硬切 / 节奏切换',evidence:'采样不足，无法判断效果；手动学习不作为检测结论。'};
 const found=detectVisualEffects(samples,shot),fade=found.find(e=>e.kind.startsWith('fade')),scale=found.find(e=>e.kind==='scale'&&e.preview?.to>1);
 if(fade)return {effect:'叠化 / 淡入淡出',evidence:fade.reason};
 if(scale)return {effect:'缓慢推近',evidence:scale.reason};
 return {effect:'硬切 / 节奏切换',evidence:'尚无可匹配的自动学习预设；这里的手动方法不代表识别到原片使用硬切。检测到的其他效果请看上方针对性步骤。'};
}

function readableSteps(steps){return steps.flatMap(value=>{const out=[];let chars=Array.from(value);while(chars.length>80){let cut=80;for(let i=79;i>=40;i--)if('，。；,; '.includes(chars[i])){cut=i+1;break}out.push(chars.slice(0,cut).join(''));chars=chars.slice(cut)}if(chars.length)out.push(chars.join(''));return out})}
export function buildEvidenceLesson(items,samples){
 if(!items.length||!samples.length)throw Error('当前范围没有可用检测线索；请先分析画面文字或切换到“手动选择的学习方法”。未知效果不会生成虚构教学。');
 let cursor=0;return items.flatMap((item,index)=>{
  const steps=item.steps.flatMap(value=>{const match=/^\s*(\d+(?:\.\d+)?)\s*秒/.exec(value),candidate=match?Number(match[1]):NaN,sourceTime=Number.isFinite(candidate)&&candidate>=item.start&&candidate<=item.end?candidate:item.start;return readableSteps([value]).map(text=>({text,sourceTime}))});
  return steps.map(({text,sourceTime},step)=>{const pic=samples.reduce((a,b)=>Math.abs(b.time-sourceTime)<Math.abs(a.time-sourceTime)?b:a),duration=Math.min(12,Math.max(4,Math.ceil(text.replace(/\s/g,'').length/7))),start=cursor;cursor+=duration;return{label:`线索 ${index+1}`,shot:index+1,range:`${item.start.toFixed(2)}–${item.end.toFixed(2)} 秒`,effect:item.title,text,step,stepCount:steps.length,parameter:item.parameters||'检测候选的试做步骤，需对照原片校正',check:item.reason,image:pic.image,frameTime:pic.time,sourceTime,start,duration}})
 });
}
