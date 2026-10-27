import {validateSkill} from './github-skills-core.js?v=20261027windows';
let active=null,activeMode=null;
export function setActiveSkill(skill,mode='guidance'){
 if(!['guidance','preset'].includes(mode))throw Error('Skill 应用方式无效');const next=skill?validateSkill(skill):null;if(next&&mode==='preset'&&!next.recipe)throw Error('这份 Skill 没有可应用的参数预设');active=next;activeMode=next?mode:null;document.dispatchEvent(new Event('editing-skill-change'));
}
export function getActiveSkill(){return active?structuredClone(active):null}
export function getPresetSkill(){return activeMode==='preset'?getActiveSkill():null}
export function getSkillMode(){return activeMode}
export function modelSkill(){if(!active)return undefined;return {name:active.name,markdown:active.markdown,sourceUrl:active.source.url,commit:active.source.commit}}
