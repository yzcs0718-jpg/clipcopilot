import {isPixelArray} from './reference-sampling.js';
import {timedCopyReport} from './subtitles.js';
export const recipes={
 '硬切 / 节奏切换':'在剪映中导入素材 → 把播放头放到动作或句子结束处 → 分割 → 删除冗余区间 → 拖动片段首尾贴齐。先用直接切换检查节奏，避免每个切口都加转场。',
 '缓慢推近':'选中片段 → 在画面缩放参数旁添加起始关键帧（100%）→ 移到片段结尾，把缩放改为约 108% → 调整位置保持主体居中。100%→108% 仅为试做参数，按主体裁切情况调整。',
 '快慢变速':'选中片段 → 找到“变速”中的“曲线变速 / 自定义”→ 在动作前后添加速度点，尝试 1×→2×→0.7×→1×。先对齐动作，再考虑音乐；低帧率素材减速可能卡顿。',
 '叠化 / 淡入淡出':'将两段视频放在主轨相邻位置 → 点击切口的转场入口 → 搜索叠化或淡入淡出 → 从约 0.2–0.4 秒开始试。过长会让动作显得拖沓。',
 '重点字幕':'文本 → 新建文本（或先识别字幕并校对）→ 按句子拆分 → 重点词换颜色或加粗 → 放在主体以外且留安全边距的位置。动画可从 0.15–0.25 秒的简短入场开始试。',
 '画中画 / 细节叠加':'把主画面放主轨 → 把细节素材放上方叠加轨（手机端通常为画中画）→ 调整缩放与位置 → 按需要添加矩形蒙版 → 对齐展示细节的文案。'
};
export function boundaries(samples,duration,threshold=.22){
 if(!Number.isFinite(duration)||duration<=0)throw Error('无效视频时长');
 const cuts=[0];for(let i=1;i<samples.length;i++){const a=samples[i-1],b=samples[i];if(!isPixelArray(a.pixels)||a.pixels.length!==b.pixels.length)throw Error('无效采样');let d=0;for(let j=0;j<a.pixels.length;j++)d+=Math.abs(a.pixels[j]-b.pixels[j]);const score=d/a.pixels.length/255;if(score>=threshold&&b.time-cuts.at(-1)>=.8&&duration-b.time>=.5)cuts.push(b.time);if(cuts.length>=20)break}return [...cuts,duration].map((t,i,a)=>i<a.length-1?{start:t,end:a[i+1]}:null).filter(Boolean)
}
export function copyAnalysis(text,duration){
 const clean=text.trim();if(!clean)return '未提供文案 / 字幕：无法判断原视频的开头钩子、论据或行动引导。请粘贴实际口播、字幕，或手动填写镜头文案后再生成。';
 const lines=clean.split(/\n|[。！？!?]/).map(x=>x.trim()).filter(Boolean);const questions=/[？?]/.test(clean);const numbers=/\d/.test(clean);const cta=/点击|收藏|关注|购买|评论|了解|试试|click|follow|shop|learn|try/i.test(clean);
 return `输入文本 ${clean.length} 字符，约 ${lines.length} 个句段；按 ${duration.toFixed(1)} 秒视频计算约 ${(clean.replace(/\s/g,'').length/duration).toFixed(1)} 字符/秒（仅供密度比较，不是语速测量）。\n开头原文：“${lines[0]?.slice(0,100)||clean.slice(0,100)}”。建议让首句明确对象、冲突或收益，再用画面证明。\n${questions?'文本含问句：检查答案是否及时给出，避免只有悬念。':'未发现问号：可尝试用一句具体问题或结果对比吸引注意。'}\n${numbers?'含数字表述：核对出处，并配对应证明画面。':'未发现数字：若有真实数据，可加入一项具体证据；不要编造。'}\n${cta?'发现可能的行动引导词：检查结尾是否只有一个明确动作。':'未发现明确行动引导词：根据目的补“收藏 / 了解 / 尝试”等一个动作。'}\n上述结果来自输入文本的规则检查，未识别音频，也未核对字幕与画面是否一致。`;
}
export function report({name,duration,width,height,shots,transcript,source='sampled'}){
 const avg=duration/shots.length;
 return `# 视频拉片报告\n\n参考视频：${name}\n规格：${width}×${height}，${duration.toFixed(1)} 秒\n${source==='timeline'?'工程镜头':'候选区间'}：${shots.length} 段，平均 ${avg.toFixed(1)} 秒/段\n\n## 证据与限制\n${source==='timeline'?'镜头来源为当前混剪工程，效果参数由工程记录提供；成片时间按总时长换算，仍需回放核对切口。没有进行音轨转录或剧情识别。':'本地抽帧 + 画面变化规则初分段；候选切点可能来自运镜、闪光或字幕变化，也可能漏掉短镜头。请先播放校正切点。本节未识别音轨、原工程、精确特效或拍摄参数；已运行的音轨分析另列。下面的排布与剪映参数是复现建议。'}\n\n## 怎么排：重剪建议\n建议顺序：最有信息量的结果 / 冲突 → 场景或问题 → 过程 / 证据 → 结果回扣 → 一个行动引导。根据实际内容选择，不能只按时间位置判断镜头作用。\n${avg>5?'候选区间偏长：检查是否包含多个信息点，可在动作或句意完整处再拆分。':'候选区间较短：检查观众是否来得及读完字幕，关键证据可适当多留时间。'}\n先找出最能说明主题的镜头放开头；中间用全景交代环境、近景证明细节；删除重复信息。\n\n## 文案分析\n${copyAnalysis(transcript,duration)}\n\n## 带时间点的文案检查\n${timedCopyReport(shots)}\n\n## 逐镜头拆解与剪映复现\n${shots.map((s,i)=>`### ${i+1}. ${s.start.toFixed(2)}–${s.end.toFixed(2)}s\n画面观察：${s.note||'尚未填写；请查看关键帧并播放核对'}\n该段文案：${s.copy||'未填写'}\n建议作用：${i===0?'开头：检查是否能快速说明主题':i===shots.length-1?'结尾：检查是否回扣主题并引导下一步':'中段：补充过程、细节或证据'}（位置建议，不是原片意图识别）\n选定复现方式：${s.effect}\n采样依据：${s.evidence||'复现方式为学习建议，尚未确认原片效果'}\n${recipes[s.effect]||recipes['硬切 / 节奏切换']}`).join('\n\n')}\n\n## 剪映操作说明\n不同版本和剪映 / CapCut 的菜单名称可能不同。关键帧、变速、转场是可尝试的复现路径，不能据此证明原片用了同一特效。\n参考：https://www.capcut.com/resource/how-to-use-capcut\nhttps://www.capcut.com/resource/how-to-add-keyframes-in-capcut\n`;
}

export function restoreNotes(data,reference){
 if(!data||data.type!=='clippilot-reference-notes'||data.version!==1)throw Error('不是支持的 ClipPilot 拉片笔记文件');
 const saved=data.reference;
 if(!saved||saved.name!==reference.name||!Number.isFinite(saved.duration)||Math.abs(saved.duration-reference.duration)>.1||saved.width!==reference.width||saved.height!==reference.height)throw Error('视频不匹配，请先加载备份对应的源视频');
 if(typeof data.transcript!=='string'||data.transcript.length>12000||!Array.isArray(data.shots)||!data.shots.length||data.shots.length>100)throw Error('笔记内容无效');
 let end=0;const shots=data.shots.map(s=>{
  if(!s||!Number.isFinite(s.start)||!Number.isFinite(s.end)||Math.abs(s.start-end)>.02||s.end<=s.start||s.end>reference.duration+.01)throw Error('镜头区间不连续或超出视频范围');
  if(!['note','copy','effect'].every(k=>typeof s[k]==='string'&&s[k].length<=1000)||!Object.hasOwn(recipes,s.effect))throw Error('镜头笔记或效果无效');
  end=s.end;return {start:s.start,end:s.end,note:s.note,copy:s.copy,effect:s.effect};
 });
 if(Math.abs(end-reference.duration)>.02)throw Error('镜头区间未覆盖完整视频');
 return {shots,transcript:data.transcript};
}
