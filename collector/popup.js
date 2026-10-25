const status=document.getElementById('status');
document.getElementById('capture').onclick=async()=>{try{
 const [tab]=await chrome.tabs.query({active:true,currentWindow:true});const u=new URL(tab.url);const hosts=['douyin.com','iesdouyin.com','xiaohongshu.com','xhslink.com','bilibili.com','b23.tv'];
 if(u.protocol!=='https:'||u.username||u.password||!hosts.some(h=>u.hostname===h||u.hostname.endsWith('.'+h)))throw Error('请先打开支持平台的具体作品页');
 const [{result}]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>({title:document.title.slice(0,500),description:(document.querySelector('meta[name="description"]')?.content||'').slice(0,2000),visibleText:(document.body?.innerText||'').slice(0,12000)})});
 const data={type:'clippilot-capture',version:1,url:u.href,creator:document.getElementById('creator').value.trim(),...result,capturedAt:new Date().toISOString(),method:'用户点击采集的页面可见文本；含导航等噪声，非视频转录'};
 const a=document.createElement('a');const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.href=url;a.download='ClipPilot-作品采集.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);status.textContent='已下载。到工作台“作品与风格库”导入。核对博主和正文；视频需另行上传。';
 }catch(e){status.textContent='采集失败：'+e.message}};

const listButton=document.getElementById('capture-list');
listButton.onclick=async()=>{try{
 const [tab]=await chrome.tabs.query({active:true,currentWindow:true});const page=new URL(tab.url),hosts=['douyin.com','iesdouyin.com','xiaohongshu.com','xhslink.com','bilibili.com','b23.tv'];
 if(page.protocol!=='https:'||page.username||page.password||!hosts.some(h=>page.hostname===h||page.hostname.endsWith('.'+h)))throw Error('请打开支持平台的账号或作品列表页');
 const [{result}]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>{const hosts=['douyin.com','iesdouyin.com','xiaohongshu.com','xhslink.com','bilibili.com','b23.tv'],items=[],seen=new Set();for(const a of document.querySelectorAll('a[href]')){if(!a.getClientRects().length)continue;let u;try{u=new URL(a.href)}catch{continue}if(u.protocol!=='https:'||u.username||u.password||!hosts.some(h=>u.hostname===h||u.hostname.endsWith('.'+h))||!/^\/(?:video|explore|discovery\/item|note)\/[A-Za-z0-9_-]+\/?$/.test(u.pathname))continue;u.hash='';u.search='';if(seen.has(u.href))continue;seen.add(u.href);items.push({url:u.href,title:(a.innerText||a.getAttribute('title')||a.querySelector('img')?.alt||'待核对作品').trim().slice(0,500)});if(items.length>=50)break}return items}});
 if(!Array.isArray(result)||!result.length)throw Error('未找到当前页已显示的作品链接。请先打开作品列表并等待加载，或进入具体作品单独采集');
 const creator=document.getElementById('creator').value.trim(),data={type:'clippilot-collection',version:1,items:result.map(item=>({type:'clippilot-capture',version:1,...item,creator,description:'',visibleText:'',capturedAt:new Date().toISOString()}))};
 const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.href=url;a.download='ClipPilot-当前页作品库.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);status.textContent=`已采集 ${result.length} 个作品链接。导入工作台后逐一核对，未抓取各作品正文或视频。`;
 }catch(e){status.textContent='批量采集失败：'+e.message}};
