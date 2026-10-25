import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const code=fs.readFileSync(new URL('../collector/popup.js',import.meta.url),'utf8');
async function capture(url){const listButton={};const status={},creator={value:'测试来源'},button={};let injection=0,download=null;const context={URL,Blob,setTimeout:fn=>fn(),document:{getElementById:id=>({status,creator,capture:button,'capture-list':listButton}[id]),createElement:()=>({click(){download=this.download}})},chrome:{tabs:{query:async()=>[{id:1,url}]},scripting:{executeScript:async({target})=>{assert.equal(target.tabId,1);injection++;return [{result:{title:'测试标题',description:'简介',visibleText:'文字'}}]}}}};vm.runInNewContext(code,context);await button.onclick();return {status:status.textContent,injection,download}}
test('用户点击采集支持站点，下载可导入文件',async()=>{const r=await capture('https://www.bilibili.com/video/BVdemo');assert.equal(r.injection,1);assert.equal(r.download,'ClipPilot-作品采集.json');assert.match(r.status,/已下载/)});
test('不支持站点拒绝注入脚本',async()=>{const r=await capture('https://bilibili.com.evil.test');assert.equal(r.injection,0);assert.equal(r.download,null);assert.match(r.status,/失败/)});

test('批量采集只导出当前页可见的有效作品链接并去重，保留可导入结构',async()=>{
 const elements={status:{},creator:{value:'填写的来源'},capture:{},'capture-list':{}};let blob;
 class URLMock extends URL{static createObjectURL(b){blob=b;return 'blob:test'}static revokeObjectURL(){}}
 const anchor=(href,text,visible=true)=>({href,innerText:text,getClientRects:()=>visible?[{}]:[],getAttribute:()=>null,querySelector:()=>null});
 const anchors=[anchor('https://www.bilibili.com/video/BVone?from=home','作品1'),anchor('https://www.bilibili.com/video/BVone','重复作品'),anchor('https://www.bilibili.com/video/BVtwo','隐藏作品',false),anchor('https://bilibili.com.evil.test/video/Bad','伪造域名'),anchor('https://www.bilibili.com/account','账号链接')];
 const context={URL:URLMock,Blob,Date,Set,setTimeout:fn=>fn(),document:{getElementById:id=>elements[id],querySelectorAll:()=>anchors,createElement:()=>({click(){}})},chrome:{tabs:{query:async()=>[{id:1,url:'https://space.bilibili.com/123'}]},scripting:{executeScript:async({func})=>[{result:func()}]}}};
 vm.runInNewContext(code,context);await elements['capture-list'].onclick();const data=JSON.parse(await blob.text());assert.equal(data.items.length,1);assert.equal(data.items[0].url,'https://www.bilibili.com/video/BVone');assert.equal(data.items[0].creator,'填写的来源');const {validateCollection}=await import('../dist/collection-core.js');assert.equal(validateCollection(data).length,1);assert.match(elements.status.textContent,/1 个作品链接/);
});
