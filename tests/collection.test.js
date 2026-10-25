import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCapture,upsertCapture,validateCollection} from '../dist/collection-core.js';
const sample={type:'clippilot-capture',version:1,url:'https://www.bilibili.com/video/BVdemo',title:'示例作品',creator:'演示来源',description:'简介',visibleText:'页面正文',capturedAt:'2026-10-25'};
test('采集导入保留来源和原文，来源始终未核验',()=>{const p=validateCapture({...sample,verified:true});assert.equal(p.verified,false);assert.equal(p.platform,'B站');assert.equal(p.visibleText,sample.visibleText)});
test('拒绝伪造域名、凭证链接和超长采集字段',()=>{for(const d of [{...sample,url:'https://bilibili.com.evil.test/video'},{...sample,url:'javascript:alert(1)'},{...sample,url:'https://a:b@www.bilibili.com'},{...sample,visibleText:'x'.repeat(12001)},{...sample,creator:3}])assert.throws(()=>validateCapture(d))});
test('相同作品更新去重，作品库有容量上限',()=>{const updated=upsertCapture([sample],{...sample,title:'新版'});assert.equal(updated.length,1);assert.equal(updated[0].title,'新版');let items=[];for(let i=0;i<55;i++)items=upsertCapture(items,{...sample,url:sample.url+i});assert.equal(items.length,50);assert.ok(items[0].url.endsWith('54'))});
test('备份恢复检验全部记录，拒绝无来源及损坏结构',()=>{assert.equal(validateCollection({type:'clippilot-collection',version:1,items:[sample]}).length,1);assert.throws(()=>validateCollection({type:'clippilot-collection',version:1,items:[{...sample,url:''}]}));assert.throws(()=>validateCollection({items:[]}))});
