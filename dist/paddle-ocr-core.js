// PP-OCRv5 CTC decoding and detector post-processing. No expected answers are embedded.
export function decodeCTC(values,dims,characters){
 const classes=dims.at(-1),steps=dims.at(-2);if(classes!==characters.length||values.length!==steps*classes)throw Error('OCR 输出与字符表不匹配');
 let previous=-1,text='',sum=0,count=0;for(let t=0;t<steps;t++){let best=0,score=-Infinity;for(let c=0;c<classes;c++){const v=values[t*classes+c];if(v>score){score=v;best=c}}if(best!==0&&best!==previous){text+=characters[best];sum+=score;count++}previous=best}return{text,confidence:count?100*sum/count:0};
}
export function textRegions(prob,width,height){
 if(prob.length!==width*height)throw Error('OCR 检测图尺寸错误');const visited=new Uint8Array(prob.length),queue=new Int32Array(prob.length),boxes=[];
 for(let i=0;i<prob.length;i++){if(visited[i]||prob[i]<.3)continue;let head=0,tail=1,minX=width,maxX=0,minY=height,maxY=0,score=0;queue[0]=i;visited[i]=1;while(head<tail){const k=queue[head++],x=k%width,y=Math.floor(k/width);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);score+=prob[k];for(const n of [x>0?k-1:-1,x<width-1?k+1:-1,y>0?k-width:-1,y<height-1?k+width:-1])if(n>=0&&!visited[n]&&prob[n]>=.3){visited[n]=1;queue[tail++]=n}}
  if(tail>=8&&maxX-minX>=4&&maxY-minY>=3&&score/tail>=.6)boxes.push({x:minX,y:minY,w:maxX-minX+1,h:maxY-minY+1,score:score/tail});
 }
 // Heatmap islands on a single line sometimes need joining; avoid joining separate text rows.
 boxes.sort((a,b)=>a.x-b.x);const merged=[];for(const box of boxes){const found=merged.find(b=>Math.abs((b.y+b.h/2)-(box.y+box.h/2))<Math.min(b.h,box.h)*.45&&box.x-(b.x+b.w)<Math.min(b.h,box.h)*.8&&box.x>=b.x&&Math.max(b.h,box.h)<Math.min(b.h,box.h)*1.8);if(found){const bottom=Math.max(found.y+found.h,box.y+box.h);found.w=Math.max(found.x+found.w,box.x+box.w)-found.x;found.y=Math.min(found.y,box.y);found.h=bottom-found.y;found.score=Math.min(found.score,box.score)}else merged.push({...box})}
 return merged.sort((a,b)=>a.y-b.y||a.x-b.x).slice(0,64);
}
