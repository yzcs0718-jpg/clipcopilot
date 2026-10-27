// Conservative, axis-aligned windows on a mostly uniform surrounding background.
// Geometry and changing content are evidence, never proof of an editing operation.
const distance=(a,b)=>(Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2]))/765;
export function findRectangularWindows(frame){
 const {width:w,height:h,pixels}=frame;
 if(w<40||h<40||pixels.length!==w*h*3)return[];
 const color=(x,y)=>{const i=(y*w+x)*3;return pixels.subarray(i,i+3)};
 const border=[];
 for(let x=0;x<w;x+=4)border.push(color(x,0),color(x,h-1));
 for(let y=0;y<h;y+=4)border.push(color(0,y),color(w-1,y));
 const bg=[0,1,2].map(c=>border.map(v=>v[c]).sort((a,b)=>a-b)[Math.floor(border.length/2)]);
 if(border.filter(c=>distance(c,bg)<.07).length/border.length<.88)return[];
 const foreground=new Uint8Array(w*h),seen=new Uint8Array(w*h),queue=new Int32Array(w*h),result=[];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)foreground[y*w+x]=distance(color(x,y),bg)>.16;
 for(let origin=0;origin<foreground.length;origin++){
  if(seen[origin]||!foreground[origin])continue;
  let head=0,tail=1,left=w,top=h,right=0,bottom=0;seen[origin]=1;queue[0]=origin;
  while(head<tail){const k=queue[head++],x=k%w,y=Math.floor(k/w);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
   for(const n of [x>0?k-1:-1,x<w-1?k+1:-1,y>0?k-w:-1,y<h-1?k+w:-1])if(n>=0&&!seen[n]&&foreground[n]){seen[n]=1;queue[tail++]=n}
  }
  const bw=right-left+1,bh=bottom-top+1;
  if(bw<Math.max(16,w*.12)||bh<Math.max(16,h*.12)||left<3||top<3||right>w-4||bottom>h-4||bw*bh>w*h*.7||tail/(bw*bh)<.94)continue;
  // All four sides must separate the interior from the same surrounding field.
  const support=[];
  for(const horizontal of [true,false])for(const low of [true,false]){
   let yes=0,total=0;
   for(let t=2;t<(horizontal?bw:bh)-2;t++){
    const x=horizontal?left+t:low?left:right,y=horizontal?low?top:bottom:top+t;
    const inside=color(x+(horizontal?0:low?1:-1),y+(horizontal?low?1:-1:0));
    const outside=color(x+(horizontal?0:low?-2:2),y+(horizontal?low?-2:2:0));
    if(distance(inside,outside)>.13&&distance(outside,bg)<.08)yes++;total++;
   }support.push(yes/total);
  }
  if(support.some(v=>v<.86))continue;
  const signature=[];
  for(let yy=0;yy<8;yy++)for(let xx=0;xx<8;xx++)signature.push(...color(Math.round(left+2+(bw-5)*(xx+.5)/8),Math.round(top+2+(bh-5)*(yy+.5)/8)));
  const mean=[0,1,2].map(c=>signature.filter((_,i)=>i%3===c).reduce((s,v)=>s+v,0)/64);
  const variance=signature.reduce((s,v,i)=>s+(v-mean[i%3])**2,0)/signature.length/65025;
  if(variance<.008)continue;
  result.push({x:(left+right)/2/w,y:(top+bottom)/2/h,w:bw/w,h:bh/h,support:Math.min(...support),signature,background:bg});
 }
 return result.sort((a,b)=>b.w*b.h-a.w*a.h).slice(0,3);
}
export function groupRectangularWindows(frames,maxGap){
 const groups=[];
 for(const frame of frames){const used=new Set();for(const box of frame.rectangles||[]){
  let group=groups.find(g=>!used.has(g)&&frame.time>g.end&&frame.time-g.end<=maxGap&&Math.hypot(g.last.x-box.x,g.last.y-box.y)<.04&&Math.abs(g.last.w-box.w)<.025&&Math.abs(g.last.h-box.h)<.025&&distance(g.last.background,box.background)<.04);
  if(!group){group={x:box.x,y:box.y,w:box.w,h:box.h,start:frame.time,end:frame.time,count:0,changes:0,path:[],last:box};groups.push(group)}
  if(group.count){const a=group.last.signature,b=box.signature,diff=a.reduce((s,v,i)=>s+Math.abs(v-b[i]),0)/a.length/255;if(diff>.035)group.changes++}
  group.count++;group.end=frame.time;group.last=box;group.path.push({time:frame.time,x:box.x,y:box.y,w:box.w,h:box.h});used.add(group);
 }}
 return groups.filter(g=>g.count>=3&&g.changes>=2).map(({last,...g})=>g);
}

// A frame contributes at most once to each temporal circle group.
export function groupCircleWindows(frames,maxGap){const groups=[];for(const frame of frames){const used=new Set();for(const c of frame.circles||[]){let g=groups.find(g=>!used.has(g)&&frame.time>g.end&&frame.time-g.end<=maxGap&&Math.hypot(g.x-c.x,g.y-c.y)<.04&&Math.abs(g.r-c.r)<.025);if(!g){g={...c,start:frame.time,end:frame.time,count:0};groups.push(g)}g.end=frame.time;g.count++;used.add(g)}}return groups.filter(g=>g.count>=3)}
