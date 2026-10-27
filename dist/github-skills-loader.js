import {githubLocation,parseSkill} from './github-skills-core.js?v=20261027windows';
async function githubJSON(path,fetcher){const r=await fetcher('https://api.github.com'+path,{headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(r.status===403||r.status===429?'GitHub 请求额度或访问权限受限，请稍后重试，或上传 SKILL.md':r.status===404?'找不到公开仓库、版本或文件；私有仓库请下载 SKILL.md 后上传':`GitHub 读取失败（${r.status}）`);const text=await r.text();if(text.length>3000000)throw Error('仓库响应过大，请粘贴具体 SKILL.md 文件链接');return JSON.parse(text)}
const enc=encodeURIComponent,parts=s=>s.split('/').map(enc).join('/');
export async function discoverGithubSkills(value,refOverride='',fetcher=fetch){
 const location=githubLocation(value,refOverride),base=`/repos/${enc(location.owner)}/${enc(location.repo)}`;let ref=location.ref;if(!ref){const repo=await githubJSON(base,fetcher);ref=repo.default_branch;if(typeof ref!=='string')throw Error('仓库没有默认分支')}
 const commit=await githubJSON(`${base}/commits/${enc(ref)}`,fetcher);if(!/^[a-f0-9]{40}$/i.test(commit.sha||'')||!/^[a-f0-9]{40}$/i.test(commit.commit?.tree?.sha||''))throw Error('无法固定 Skill 提交版本');
 const common={...location,ref,commit:commit.sha,base};if(/(?:^|\/)SKILL\.md$/i.test(location.path))return {...common,paths:[location.path],truncated:false};
 const tree=await githubJSON(`${base}/git/trees/${commit.commit.tree.sha}?recursive=1`,fetcher);if(!Array.isArray(tree.tree))throw Error('仓库目录结构无效');const all=tree.tree.filter(x=>x.type==='blob'&&typeof x.path==='string'&&/(?:^|\/)SKILL\.md$/i.test(x.path)&&(!location.path||x.path.startsWith(location.path.replace(/\/$/,'')+'/'))).map(x=>x.path).sort();if(!all.length)throw Error(tree.truncated?'仓库目录被截断，请使用具体 SKILL.md 链接':'没有找到 SKILL.md，请提供文件链接或上传文件');return {...common,paths:all.slice(0,100),truncated:Boolean(tree.truncated||all.length>100)};
}
export async function loadGithubSkill(discovery,path,fetcher=fetch){
 if(!discovery.paths.includes(path))throw Error('请选择发现列表中的 Skill');
 const file=await githubJSON(`${discovery.base}/contents/${parts(path)}?ref=${discovery.commit}`,fetcher);if(file.type!=='file'||file.encoding!=='base64'||typeof file.content!=='string'||file.content.length>100000||file.size>64000)throw Error('Skill 需为不超过 64KB 的文本文件');
 let markdown;try{markdown=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(file.content.replace(/\s/g,'')),c=>c.charCodeAt(0)))}catch{throw Error('Skill 文件不是有效的 UTF-8 文本')}
 return parseSkill(markdown,{url:`https://github.com/${discovery.owner}/${discovery.repo}/blob/${discovery.commit}/${parts(path)}`,commit:discovery.commit,path,repository:`${discovery.owner}/${discovery.repo}`});
}
