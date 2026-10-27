import{spatialFrameMarks,textFrameMarks}from './frame-review-core.js?v=20261027motion';
let dialog;
export function frameOverlay(frame,marks,{large=false}={}){
 const wrapper=document.createElement('div');wrapper.className='review-frame'+(large?' review-frame-large':'');
 const image=document.createElement('img');image.src=large?(frame.originalImage||frame.image):frame.image;image.alt=`${frame.time.toFixed(2)} 秒实际分析输入`;image.loading=large?'eager':'lazy';wrapper.append(image);
 const layer=document.createElement('div');layer.className='review-mark-layer';
 for(const mark of marks){const shape=document.createElement('span');shape.className='review-mark review-mark-'+mark.shape;Object.assign(shape.style,{left:mark.box.x*100+'%',top:mark.box.y*100+'%',width:mark.box.w*100+'%',height:mark.box.h*100+'%'});shape.setAttribute('aria-label',mark.label);layer.append(shape)}wrapper.append(layer);return wrapper;
}
export function openFrameReview(frames,index=0,{mode='spatial',allowSeek=true}={}){
 if(!frames.length)return;
 if(!dialog){dialog=document.createElement('dialog');dialog.className='frame-review-dialog';dialog.setAttribute('aria-label','逐帧证据核对');document.body.append(dialog);document.addEventListener('reference-changed',()=>dialog.close())}
 let current=Math.min(frames.length-1,Math.max(0,index)),showMarks=true;
 function draw(){const frame=frames[current],marks=mode==='text'?textFrameMarks(frame):spatialFrameMarks(frame);dialog.replaceChildren();const header=document.createElement('div');header.className='row';const title=document.createElement('h3');title.tabIndex=-1;title.textContent=`${frame.time.toFixed(2)} 秒 · ${mode==='text'?'文字':'空间'}分析原始采样`;const close=document.createElement('button');close.textContent='关闭';close.className='secondary';close.onclick=()=>dialog.close();header.append(title,close);dialog.append(header);
 const note=document.createElement('p');note.className='muted';note.textContent=`这里只浏览实际采样，不包含每个视频帧。${frame.sampleWidth?'边界检测采用 '+frame.sampleWidth+'×'+frame.sampleHeight+' 缩图，放大图为原视频同一时刻画面。':''}边框不是原工程轨道，也不证明用了蒙版或抠像。可隐藏标记核对。`;dialog.append(note);
 const preview=frameOverlay(frame,marks,{large:true});preview.querySelector('.review-mark-layer').hidden=!showMarks;dialog.append(preview);
 if(frame.maskImage){const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='对照本帧新计算的人物遮罩';const image=document.createElement('img');image.src=frame.maskImage;image.className='review-matte';image.alt='新计算的人物前景概率，白色为人物候选';details.append(summary,image);dialog.append(details)}
 const info=document.createElement('p');info.className='review-frame-info';info.textContent=mode==='text'?`原始识别：${frame.rawText||'没有获得文字'}`:marks.length?marks.map(m=>m.label).join('；'):'本采样未提取到空间边界或可靠人物；不代表没有效果。';dialog.append(info);
 const controls=document.createElement('div');controls.className='review-controls';const label=document.createElement('label'),toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=showMarks;toggle.onchange=()=>{showMarks=toggle.checked;preview.querySelector('.review-mark-layer').hidden=!showMarks};label.append(toggle,document.createTextNode('显示测量标记'));controls.append(label);
 if(allowSeek){const seek=document.createElement('button');seek.className='secondary';seek.textContent='定位原片此帧';seek.onclick=()=>{document.dispatchEvent(new CustomEvent('reference-frame-seek',{detail:frame.time}));dialog.close()};controls.append(seek)}
 const previous=document.createElement('button'),next=document.createElement('button'),count=document.createElement('span');previous.className=next.className='secondary';previous.textContent='上一帧';next.textContent='下一帧';previous.disabled=current===0;next.disabled=current===frames.length-1;previous.onclick=()=>{current--;draw();dialog.querySelector('h3').focus()};next.onclick=()=>{current++;draw();dialog.querySelector('h3').focus()};count.textContent=`${current+1} / ${frames.length}`;controls.append(previous,count,next);dialog.append(controls)}
 draw();if(!dialog.open)dialog.showModal();
}
export function reviewThumbnail(frames,index,options={}){const frame=frames[index],button=document.createElement('button');button.type='button';button.className='review-thumbnail';button.setAttribute('aria-label',`放大查看 ${frame.time.toFixed(2)} 秒${options.mode==='text'?'文字':'空间'}证据`);button.append(frameOverlay(frame,options.mode==='text'?textFrameMarks(frame):spatialFrameMarks(frame)));button.onclick=()=>openFrameReview(frames,index,options);return button}
