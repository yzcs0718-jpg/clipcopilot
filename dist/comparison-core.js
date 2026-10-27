export function comparisonState(item,time){
 const p=item?.preview;if(!p||!Number.isFinite(time)||!Number.isFinite(item.start)||!Number.isFinite(item.end)||item.end<item.start)return null;
 const progress=Math.max(0,Math.min(1,(time-item.start)/Math.max(.001,item.end-item.start)));
 if(p.kind==='flash')return{kind:p.kind,white:time>=p.peakStart-1e-6&&time<=p.peakEnd+1e-6+Math.min(.04,p.precision||.008)?1:0};
 if(p.kind==='fade-in'||p.kind==='fade-out')return{kind:p.kind,alpha:p.kind==='fade-in'?progress:1-progress};
 if(p.kind==='freeze')return{kind:p.kind};
 if(p.kind==='scale'&&Number.isFinite(p.to))return{kind:p.kind,scale:1+(p.to-1)*progress};
 if(p.kind==='text'&&p.keyframes?.length){const nodes=p.keyframes;const b=nodes.find(n=>n.time>=time)||nodes.at(-1),a=[...nodes].reverse().find(n=>n.time<=time)||nodes[0],t=b.time>a.time?Math.max(0,Math.min(1,(time-a.time)/(b.time-a.time))):0;return{kind:p.kind,text:p.text,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,width:a.width+(b.width-a.width)*t,visible:time>=item.start&&time<=item.end}}
 return null;
}
export function canCompare(item){return comparisonState(item,item?.start)!==null}
