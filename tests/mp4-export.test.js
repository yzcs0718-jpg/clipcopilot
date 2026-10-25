import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMP4Recorder,verifyMP4,mp4Types} from '../dist/mp4-export.js';
test('MP4 export negotiates actual encoders and falls through constructor failure',()=>{
 const attempts=[];class Recorder {static isTypeSupported(t){return t.startsWith('video/mp4')}constructor(stream,options){attempts.push(options);if(attempts.length===1)throw Error('hardware unavailable');this.mimeType=options.mimeType;this.stream=stream}}
 const stream={};const result=createMP4Recorder(stream,Recorder);assert.equal(result.stream,stream);assert.equal(result.mimeType,mp4Types[1]);assert.equal(attempts[1].audioBitsPerSecond,128000);
});
test('WebM-only browser fails explicitly rather than relabeling the file',()=>{
 class Recorder {static isTypeSupported(t){return t.startsWith('video/webm')}}
 assert.throws(()=>createMP4Recorder({},Recorder),/无法编码 MP4/);
});
test('MP4 signature validation blocks mislabeled WebM and empty output',async()=>{
 await assert.rejects(verifyMP4(new Blob([new Uint8Array(20)])),/有效 MP4/);
 await assert.rejects(verifyMP4(new Blob([])),/为空/);
 const data=new Uint8Array([0,0,0,24,102,116,121,112,105,115,111,109]);const blob=new Blob([data],{type:'video/mp4'});assert.equal(await verifyMP4(blob),blob);
});
