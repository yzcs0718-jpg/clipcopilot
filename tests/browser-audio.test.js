import test from 'node:test';import assert from 'node:assert/strict';import{audioReport}from '../dist/browser-audio-core.js';
test('音轨候选显示实际区间与模型分数，不把分数写成准确率',()=>{const r=audioReport({mode:'events',notice:'待核对',segments:[{start:0,end:5,candidates:[{label:'Speech',score:.7}]}]});assert.match(r,/0.00–5.00/);assert.match(r,/人声/);assert.match(r,/不是准确率/)});
test('转录保留空结束时间，近静音不虚构文字',()=>{assert.match(audioReport({mode:'speech',result:{text:'实际测试',chunks:[{timestamp:[1,null],text:'实际测试'}]}}),/1.00–\?/);assert.match(audioReport({mode:'events',segments:[{start:0,end:2,candidates:[]}]}),/未生成声音名称/)});
