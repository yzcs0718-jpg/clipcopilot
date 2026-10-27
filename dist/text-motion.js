// Measure visible OCR geometry across all observations, never infer an editor preset.
const center=o=>({x:o.box.x+o.box.w/2,y:o.box.y+o.box.h/2});
function errorAt(observations,index,a,b){const p=observations[index],u=(p.time-a.time)/Math.max(1e-9,b.time-a.time),c=center(p),ca=center(a),cb=center(b),predX=ca.x+(cb.x-ca.x)*u,predY=ca.y+(cb.y-ca.y)*u,predW=Math.exp(Math.log(a.box.w)+(Math.log(b.box.w)-Math.log(a.box.w))*u);return Math.max(Math.hypot(c.x-predX,c.y-predY)/.012,Math.abs(Math.log(p.box.w/predW))/.08)}
export function textMotion(observations,budget=12){
 const points=observations.filter(o=>Number.isFinite(o.time)&&o.box&&['x','y','w','h'].every(k=>Number.isFinite(o.box[k]))&&o.box.w>0&&o.box.h>0).sort((a,b)=>a.time-b.time).filter((o,i,a)=>!i||o.time>a[i-1].time);
 if(!points.length)return{moving:false,scaling:false,keyframes:[],positionPattern:'',scalePattern:''};
 const centers=points.map(center),xs=centers.map(c=>c.x),ys=centers.map(c=>c.y),widths=points.map(p=>p.box.w),rx=Math.max(...xs)-Math.min(...xs),ry=Math.max(...ys)-Math.min(...ys);
 const movingFlag=points.length>=2&&Math.hypot(rx,ry)>.035,scaling=points.length>=2&&Math.max(...widths)/Math.min(...widths)>1.2;
 const chosen=[0,...(points.length>1?[points.length-1]:[])];
 while(chosen.length<Math.max(2,Math.min(12,budget))){let worst=1,at=-1;for(let j=1;j<chosen.length;j++)for(let i=chosen[j-1]+1;i<chosen[j];i++){const error=errorAt(points,i,points[chosen[j-1]],points[chosen[j]]);if(error>worst){worst=error;at=i}}if(at<0)break;chosen.push(at);chosen.sort((a,b)=>a-b)}
 const keyframes=chosen.map(i=>({time:points[i].time,...center(points[i]),width:points[i].box.w,scale:points[i].box.w/points[0].box.w}));
 function directions(field,threshold){const signs=[];for(let i=1;i<keyframes.length;i++){const d=field(keyframes[i])-field(keyframes[i-1]);if(Math.abs(d)<threshold)continue;const sign=Math.sign(d);if(signs.at(-1)!==sign)signs.push(sign)}return signs}
 const axis=rx>=ry?'x':'y',positionDirections=directions(p=>p[axis],.015),scaleDirections=directions(p=>Math.log(p.scale),.08),first=centers[0],last=centers.at(-1),returns=movingFlag&&Math.hypot(first.x-last.x,first.y-last.y)<.025;
 const words=axis==='x'?['向左','向右']:['向上','向下'];
 const positionPattern=!movingFlag?'':positionDirections.length>2?'位置多次改变方向':positionDirections.length===2?words[positionDirections[0]>0?1:0]+'后'+words[positionDirections[1]>0?1:0]+(returns?'，首尾位置接近':''):words[positionDirections[0]>0?1:0]+'移动';
 const scalePattern=!scaling?'':scaleDirections.length>2?'文字框宽度多次改变方向':scaleDirections.length===2?(scaleDirections[0]>0?'先放大后缩小':'先缩小后放大')+(Math.abs(Math.log(widths.at(-1)/widths[0]))<.12?'，首尾宽度接近':''):scaleDirections[0]>0?'文字框逐渐变宽':'文字框逐渐变窄';
 return{moving:movingFlag,scaling,keyframes,positionPattern,scalePattern,returnsToStart:returns,positionRange:Math.hypot(rx,ry),scaleRange:Math.max(...widths)/Math.min(...widths)};
}
