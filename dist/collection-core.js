import {sourceLink} from './reference-style.js?v=20261027windows';
export function validateCapture(d){
 if(!d||d.type!=='clippilot-capture'||d.version!==1)throw Error('不是支持的作品采集文件');
 const link=sourceLink(d.url);if(!link.url)throw Error('缺少作品链接');
 for(const [k,max] of [['title',500],['creator',80],['description',2000],['visibleText',12000]])if(typeof d[k]!=='string'||d[k].length>max)throw Error('采集字段无效：'+k);
 return {type:d.type,version:1,...link,title:d.title,creator:d.creator,description:d.description,visibleText:d.visibleText,capturedAt:typeof d.capturedAt==='string'?d.capturedAt.slice(0,80):'',verified:false};
}
export function upsertCapture(items,data){const d=validateCapture(data);return [d,...items.filter(x=>x.url!==d.url)].slice(0,50)}
export function validateCollection(data){if(!data||data.type!=='clippilot-collection'||data.version!==1||!Array.isArray(data.items)||data.items.length>50)throw Error('作品库格式无效');return data.items.map(validateCapture)}
