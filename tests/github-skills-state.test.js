import test from 'node:test';import assert from 'node:assert/strict';
import {setActiveSkill,getActiveSkill,getPresetSkill,modelSkill} from '../dist/github-skills-state.js';
import {parseSkill} from '../dist/github-skills-core.js';
test('启用本地 AI 指导不会偷偷改变规则初稿参数或字幕',()=>{globalThis.document={dispatchEvent(){}};try{const skill=parseSkill('# 示例\n```clippilot\n{"version":1,"target":15,"captions":["建议文案"]}\n```');setActiveSkill(skill);assert.equal(getPresetSkill(),null);assert.equal(modelSkill().name,'示例');setActiveSkill(skill,'preset');assert.equal(getPresetSkill().recipe.target,15);setActiveSkill(null);assert.equal(getActiveSkill(),null);assert.equal(modelSkill(),undefined)}finally{delete globalThis.document}});
test('纯文字 Skill 不能伪装成可执行参数预设',()=>{globalThis.document={dispatchEvent(){}};try{assert.throws(()=>setActiveSkill(parseSkill('# 文字指导'),'preset'),/没有/);assert.equal(getPresetSkill(),null)}finally{delete globalThis.document}});
