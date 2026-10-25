import {validateSkill} from './github-skills-core.js';
let active=null;
export function setActiveSkill(skill){active=skill?validateSkill(skill):null;document.dispatchEvent(new Event('editing-skill-change'))}
export function getActiveSkill(){return active?structuredClone(active):null}
export function modelSkill(){if(!active)return undefined;return {name:active.name,markdown:active.markdown,sourceUrl:active.source.url,commit:active.source.commit}}
