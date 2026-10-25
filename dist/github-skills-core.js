export const MAX_SKILL_CHARS=32000;
const styles=['punchy','gentle','explain'],kinds=['product','tutorial','story'];
export function githubLocation(value,refOverride=''){
 if(typeof value!=='string'||value.length>2000)throw Error('请输入 GitHub 仓库或 SKILL.md 链接');let u;try{u=new URL(value.trim())}catch{throw Error('请使用完整的 HTTPS GitHub 链接')}
 if(u.protocol!=='https:'||u.username||u.password||u.port||!['github.com','raw.githubusercontent.com'].includes(u.hostname))throw Error('只支持 github.com 或 raw.githubusercontent.com 的公开 HTTPS 链接');
 let parts;try{parts=u.pathname.split('/').filter(Boolean).map(decodeURIComponent)}catch{throw Error('链接编码无效')}
 const [owner,rawRepo]=parts,repo=rawRepo?.replace(/\.git$/,'');if(!/^[A-Za-z0-9-]{1,100}$/.test(owner||'')||! /^(?!\.\.?$)[A-Za-z0-9_.-]{1,100}$/.test(repo||''))throw Error('仓库名称无效');
 let ref='',path='';if(u.hostname==='raw.githubusercontent.com'){ref=parts[2]||'';path=parts.slice(3).join('/')}else if(parts.length>2){if(!['blob','tree'].includes(parts[2]))throw Error('请粘贴仓库首页、目录或 SKILL.md 文件链接');ref=parts[3]||'';path=parts.slice(4).join('/')}
 if(refOverride){if(typeof refOverride!=='string'||refOverride.length>200)throw Error('分支或版本无效');ref=refOverride.trim();const tail=parts.slice(u.hostname==='raw.githubusercontent.com'?2:3).join('/');if(tail.startsWith(ref+'/'))path=tail.slice(ref.length+1)}
 if(ref.length>200||/[\x00-\x20?&#]/.test(ref)||ref.startsWith('/')||ref.split('/').some(p=>p==='..'||p==='.'))throw Error('分支或版本无效');
 if(path.length>1000||path.split('/').some(p=>p==='..'||p==='.'||p.includes('\\'))||/[\x00-\x1f]/.test(path))throw Error('Skill 路径无效');
 if(u.hostname==='raw.githubusercontent.com'&&!/SKILL\.md$/i.test(path))throw Error('Raw 链接必须指向 SKILL.md');
 return {owner,repo,ref,path,sourceUrl:`https://github.com/${owner}/${repo}`};
}
export function validateRecipe(recipe){
 if(!recipe||typeof recipe!=='object'||Array.isArray(recipe)||recipe.version!==1)throw Error('ClipPilot 预设需要 version: 1');
 const allowed=['version','style','kind','target','topic','captions','ratio'];if(Object.keys(recipe).some(k=>!allowed.includes(k)))throw Error('预设包含不支持的字段；只支持风格、方向、时长、主题、文案及比例');
 if(recipe.style!==undefined&&!styles.includes(recipe.style))throw Error('不支持的预设风格');if(recipe.kind!==undefined&&!kinds.includes(recipe.kind))throw Error('不支持的内容方向');
 if(recipe.target!==undefined&&(!Number.isFinite(recipe.target)||recipe.target<3||recipe.target>60))throw Error('预设时长需为 3–60 秒');
 if(recipe.topic!==undefined&&(typeof recipe.topic!=='string'||recipe.topic.length>80))throw Error('预设主题最多 80 字');
 if(recipe.captions!==undefined&&(!Array.isArray(recipe.captions)||!recipe.captions.length||recipe.captions.length>20||!recipe.captions.every(s=>typeof s==='string'&&s.trim()&&s.length<=200)))throw Error('预设文案支持 1–20 行，每行最多 200 字');
 if(recipe.ratio!==undefined&&!['9:16','16:9','1:1'].includes(recipe.ratio))throw Error('预设画幅无效');return structuredClone(recipe);
}
export function parseSkill(markdown,source={}){
 if(!source||typeof source!=='object'||Array.isArray(source))throw Error('来源资料无效');
 if(typeof markdown!=='string'||!markdown.trim()||markdown.length>MAX_SKILL_CHARS||markdown.includes('\0'))throw Error('Skill 说明需为非空 Markdown，最多 32000 字符');
 markdown=markdown.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');let body=markdown,meta='';const match=markdown.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);if(match){meta=match[1];body=markdown.slice(match[0].length)}
 function field(key){const m=meta.match(new RegExp('^'+key+':\\s*([^\\n]+)$','m'));return m?m[1].trim().replace(/^(['"])(.*)\1$/,'$2'):''}
 const name=(field('name')||body.match(/^#\s+(.+)$/m)?.[1]||'未命名剪辑 Skill').slice(0,100),description=field('description').slice(0,1000);
 const blocks=[...body.matchAll(/^```clippilot\s*\n([\s\S]*?)^```\s*$/gm)];if(blocks.length>1)throw Error('每份 Skill 最多包含一个 clippilot 预设块');let recipe=null;if(blocks.length){try{recipe=validateRecipe(JSON.parse(blocks[0][1]))}catch(e){throw Error('剪辑预设无效：'+e.message)}}
 const src={url:source.url||'',commit:source.commit||'',path:source.path||'',repository:source.repository||''};if(src.url)githubLocation(src.url);if(src.commit&&!/^[0-9a-f]{40}$/i.test(src.commit))throw Error('提交版本无效');for(const value of Object.values(src))if(typeof value!=='string'||value.length>2000)throw Error('来源资料无效');
 const requirements=body.split('\n').filter(s=>/^\s*(?:[-*]|\d+[.)])\s+/.test(s)).map(s=>s.replace(/^\s*(?:[-*]|\d+[.)])\s+(?:\[[ xX]\]\s*)?/,'').trim()).filter(Boolean).slice(0,12).map(s=>s.slice(0,300));
 const runtimeHints=/\b(?:scripts\/|references\/|assets\/|ffmpeg|python3?|pip install|npm install|bash|curl)\b/i.test(body);
 return {type:'clippilot-github-skill',version:1,name,description,markdown,recipe,requirements,runtimeHints,source:src};
}
export function validateSkill(skill){if(!skill||skill.type!=='clippilot-github-skill'||skill.version!==1)throw Error('不是支持的 Skill 备份');return parseSkill(skill.markdown,skill.source)}
export function provenance(skill,method){return {name:skill.name,url:skill.source.url,commit:skill.source.commit,path:skill.source.path,method}}
export function validateProvenance(p){if(!p||!['name','url','commit','path','method'].every(k=>typeof p[k]==='string'&&p[k].length<=2000))throw Error('Skill 来源无效');if(p.url)githubLocation(p.url);if(p.commit&&!/^[a-f0-9]{40}$/i.test(p.commit))throw Error('Skill 提交版本无效');return p}
export function applyRecipeCaptions(result,skill){if(!skill?.recipe)return result;const recipe=validateRecipe(skill.recipe);return {...result,clips:result.clips.map((c,i)=>({...c,caption:recipe.captions?recipe.captions[Math.min(i,recipe.captions.length-1)]:c.caption})),copy:recipe.captions?recipe.captions.join('\n'):result.copy,skill:provenance(skill,'规则预设；文字说明未由模型解读')}}
