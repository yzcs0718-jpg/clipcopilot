export function parseSrt(text,duration){
 if(typeof text!=='string'||text.length>100000||!Number.isFinite(duration)||duration<=0)throw Error('字幕或视频时长无效');
 const stamp=s=>{const m=s.match(/^(\d{1,3}):([0-5]\d):([0-5]\d)[,.](\d{3})$/);if(!m)throw Error('字幕时间格式无效');return Number(m[1])*3600+Number(m[2])*60+Number(m[3])+Number(m[4])/1000};
 const blocks=text.replace(/^\uFEFF/,'').replace(/\r/g,'').trim().split(/\n\s*\n/);const cues=[];
 for(const block of blocks){const lines=block.split('\n');if(/^\d+$/.test(lines[0].trim()))lines.shift();const time=lines.shift()?.match(/^(\S+)\s+-->\s+(\S+)\s*$/);if(!time)throw Error('SRT 缺少时间行，请检查文件');const start=stamp(time[1]),end=stamp(time[2]);const copy=lines.join(' ').replace(/<[^>]*>/g,'').trim();if(start>=end||end>duration+.1||start<0||!copy||copy.length>1000)throw Error('字幕超出视频、内容过长或区间无效');if(cues.length&&start<cues.at(-1).start)throw Error('字幕时间未排序');cues.push({start,end,copy});if(cues.length>2000)throw Error('字幕条数过多')}
 return cues;
}
export function mapSubtitles(shots,cues){if(!shots.length||!cues.length)throw Error('请先拉片并导入有效的 SRT 字幕');return shots.map(s=>({...s,copy:cues.filter(c=>c.start<s.end&&c.end>s.start).map(c=>c.copy).join(' ').slice(0,1000)}))}
export function timedCopyReport(shots){return shots.filter(s=>s.copy).map((s,i)=>{const tags=[];if(/[？?]/.test(s.copy))tags.push('问句钩子候选');if(/\d/.test(s.copy))tags.push('含数字，需核对证据');if(/收藏|关注|购买|点击|评论|试试|follow|click/i.test(s.copy))tags.push('行动引导候选');const density=s.copy.replace(/\s/g,'').length/(s.end-s.start);if(density>7)tags.push('阅读密度偏高');return `${s.start.toFixed(2)}–${s.end.toFixed(2)}s｜${s.copy}\n规则提示：${tags.join('；')||'检查该句承担的叙事作用与对应画面'}；${density.toFixed(1)} 字符/秒。`}).join('\n\n')||'尚无逐镜头文案。可导入与视频对应的 SRT，或在镜头卡片填写。'}
