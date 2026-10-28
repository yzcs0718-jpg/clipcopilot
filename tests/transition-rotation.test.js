import test from 'node:test';import assert from 'node:assert/strict';import{detectRotationEffects}from'../dist/rotation-effects.js';import{detectDissolves}from'../dist/dissolve-effects.js';import{comparisonState}from'../dist/comparison-core.js';import{buildEffectAudit}from'../dist/effect-audit.js';
const w=64,h=36;let seed=9;const texture=Array.from({length:w*h},()=>{seed=(seed*1664525+1013904223)>>>0;return 30+seed%190});
const frame=(time,a)=>({time,pixelWidth:w,pixelHeight:h,pixels:Uint8Array.from(a.flatMap(v=>[v,v,v]))});
function rotate(angle,aspect=w/h){const r=angle*Math.PI/180,c=Math.cos(r),s=Math.sin(r),sx=aspect*h/w;return Array.from({length:w*h},(_,i)=>{const x=i%w-w/2,y=Math.floor(i/w)-h/2,ax=x*c+y*s/sx+w/2,ay=-x*s*sx+y*c+h/2,ix=Math.floor(ax),iy=Math.floor(ay);if(ix<0||iy<0||ix+1>=w||iy+1>=h)return 40;const u=ax-ix,v=ay-iy;return texture[iy*w+ix]*(1-u)*(1-v)+texture[iy*w+ix+1]*u*(1-v)+texture[(iy+1)*w+ix]*(1-u)*v+texture[(iy+1)*w+ix+1]*u*v})}
test('正反旋转有实测中间节点、方向及直接剪映步骤',()=>{for(const sign of [1,-1]){const f=[0,3,6,9,12].map((a,i)=>frame(i*.5,rotate(a*sign))),r=detectRotationEffects(f,{start:0,end:2.1});assert.equal(r.length,1);assert.equal(r[0].preview.keyframes.at(-1).angle,12*sign);assert.match(r[0].steps[1],sign===1?/顺时针/:/逆时针/);assert.equal(comparisonState(r[0],1).angle,6*sign)}});
test('静止、整体平移、无纹理、跳切和反向来回不冒充连续旋转',()=>{const shot={start:0,end:2.1};for(const f of [[0,0,0,0,0].map((a,i)=>frame(i*.5,rotate(a))),[0,3,0,-3,0].map((a,i)=>frame(i*.5,rotate(a))),[0,1,2,3,4].map((dx,i)=>frame(i*.5,texture.map((_,p)=>texture[Math.floor(p/w)*w+Math.max(0,p%w-dx)]))),[0,1,2,3,4].map((a,i)=>frame(i*.5,Array(w*h).fill(80+a)) )])assert.equal(detectRotationEffects(f,shot).length,0)});
const other=texture.map((v,i)=>texture[(i*37+17)%texture.length]);
const mix=alpha=>texture.map((v,i)=>v*(1-alpha)+other[i]*alpha);
const series=alphas=>alphas.map((a,i)=>frame(i/6,mix(a)));
test('双画面叠化从实际像素拟合混合，进入清单、步骤与对比',()=>{const f=series([0,0,0,.15,.3,.5,.7,.85,1,1,1,1]),r=detectDissolves(f);assert.equal(r.length,1);assert.match(r[0].steps[0],/重叠/);assert.ok(r[0].start<=.5&&r[0].end>=1.2);assert.ok(Math.abs(comparisonState(r[0],5/6).alpha-.5)<.02);assert.ok(buildEffectAudit(f,[{start:0,end:2}])[0].evidence.some(e=>e.kind==='dissolve'))});
test('硬切、往返闪烁、曝光渐变、恒定画面与稀疏采样不是双画面叠化',()=>{for(const f of [series([0,0,0,0,0,1,1,1,1,1]),series([0,0,.3,.6,.3,.6,1,1,1]),series(Array(12).fill(0)),Array.from({length:12},(_,i)=>frame(i/6,texture.map(v=>v*(.5+i*.03)))),series([0,0,.15,.3,.5,.7,.85,1,1]).map(f=>({...f,time:f.time*5}))])assert.equal(detectDissolves(f).length,0)});

test('没有稳定尾帧的持续混合不能提前宣称已经叠化到100%',()=>{assert.equal(detectDissolves(series([0,0,0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1])).length,0)});

test('竖屏和方屏按源画面比例拟合角度，不能按拉伸的采样网格估计',()=>{for(const aspect of [9/16,1]){const f=[0,3,6,9,12].map((a,i)=>({...frame(i*.5,rotate(a,aspect)),sourceAspectRatio:aspect}));const r=detectRotationEffects(f,{start:0,end:2.1});assert.equal(r.length,1);assert.equal(r[0].preview.keyframes.at(-1).angle,12)}});
test('无关场景切换不生成旋转教学',()=>{const f=[texture,other,texture,other,other].map((a,i)=>frame(i*.5,a));assert.equal(detectRotationEffects(f,{start:0,end:2.1}).length,0)});
