# ClipPilot desktop browser verification

## Scope and evidence
Source visual truth: /workspace/scratch/f16604b01a91/generated_images/exec-04c4ec9d-db63-4c1e-b51f-55d9f87f9332.png
Implementation screenshot: /workspace/scratch/clippilot-verified-home.jpg
Comparison evidence: /workspace/scratch/f16604b01a91/clippilot-design-comparison.jpg
Browser: cloud Chrome, actual published interface, https://clippilot-video-workbench.ablewood256.chatgpt.site/#edit
CSS viewport observed: 1363 × 936; screenshot 1348 × 926; source visual 1487 × 1058. Full-view comparison normalized to a common width with aspect ratios preserved; no stretched images. Source portrays a loaded demo; the implemented initial state uses a clearly labeled illustrative poster and thumbnails, which are replaced by actual uploaded-video frames.

## Comparison history
- Initial P1: title wrapped to three lines; P2: import label inherited flex growth and filled the action row. Evidence: /workspace/scratch/clippilot-qa-before.jpg. Fixed heading scale and upload flex sizing. Post-fix title occupies two lines and import/demo controls remain separated, visible in final screenshot and comparison.
- P1 functional: 6-second export produced only 6 video frames while capture canvas was hidden and export decoder detached. Fixed by displaying the live rendering canvas and decoder in preview and drawing on a fixed interval. Post-fix real 4-second export contains 120 VP9 video frames at 720×1280 plus Opus audio.
- P2 functional: inputs committed only on change/blur, risking stale caption copy. Updated input handling to commit immediately and group undo by focus session. Browser fill then immediate copy preserved captions; reorder preserved matching captions.
- P2 functional: blanket re-enabling after export activated invalid first-up/last-down buttons. Preserve each control's disabled state. After cancellation, first-up and last-down remain disabled and export becomes enabled.

## Required fidelity surfaces
Typography: serif headline and wordmark with readable sans-serif controls; two-line title confirmed. A somewhat smaller title than the generated mock is retained to avoid clipping across desktop widths (P3).
Spacing/layout: selected editorial structure preserved: header, asymmetric hero, rounded large preview, horizontal storyboard, primary export. Native controls and source workflow disclosures are intentional additions. Final screenshot shows no overlapping primary controls. Narrow/mobile viewport was not captured.
Colors/tokens: warm ivory paper, dark text and cobalt primary actions match the chosen direction. Secondary rules are light neutral.
Image quality: actual generated architectural photograph, high-quality JPG derivative, rounded preview and thumbnails. No synthetic SVG illustration substitutes. Initial imagery is explicitly labeled illustrative; actual upload generates source-frame thumbnails.
Copy/content: short actual workflow labels, explicit AI/data limitations. Original mock's fictional 24-second playback data is not displayed for an empty project.
Full-view comparison is readable at the combined 2000-pixel width, including title, control spacing and masking. No additional focused crop required for these components.

## Browser interactions tested
- First-entry guide, close/start, mode switching.
- File chooser upload of test MP4 and automatic draft.
- Two-clip built-in demo, actual-frame storyboard and clip preview/caption.
- Caption input, copy, reordering.
- Actual WebM download; ffprobe confirms 720×1280 VP9, 120 video frames for a 4-second dynamic source, Opus audio.
- Cancel export and restore control boundary states.
- SRT download.
- Reference demo, 8-frame extraction, generated candidate segment and local report.
- Reference note/effect change, regenerate report and validate keyframe recipe text.
- Markdown report download.
- AI configuration link opens both enclosing disclosures and focuses endpoint.

Console checked: observed errors are from chrome-extension:// content-script metadata reporting, not site scripts. No site-script errors observed during tested flows.

## Remaining limits and follow-up polish
Desktop browser scope only. Real model invocation requires the user's own configured backend and key; no live AI endpoint tested. This is not a guarantee for all browsers, long videos, media codecs or mobile devices. Current generic local report is rule-based; model analysis remains optional.

## Implementation checklist
[x] Capture actual published UI
[x] Compare with selected design
[x] Fix title and control widths
[x] Fix export frame capture
[x] Verify export artifact
[x] Fix immediate caption persistence and disabled boundary restoration
[x] Recheck browser interactions and logs

final result: passed

## 2026-10-16 upgrade verification
Published script-to-storyboard flow tested in desktop Chrome: Markdown heading ignored, two caption lines generated two sequential 4-second clips. WebM export completed and controls recovered. Missing API credentials produced actionable feedback. Console errors observed belonged to the Chrome extension, not app scripts. Actual local Agent rendered a 4.021-second H.264/AAC captioned MP4; full decode and sampled frames passed. New API, Agent and JS tests: 15 passed. Live model credentials, Docker runtime and mobile are unverified.

## 2026-10-24 functional pass
Preview URL returned by sites-preview: http://terminal.local:4173/. Two demo clips loaded, first clip split at midpoint into two 1.5-second clips; total remains 6 seconds across 3 clips. Sequential preview reached completion. Actual WebM download decoded fully without FFmpeg errors: VP9 1280x720, 177 video frames, audio Opus with packet timestamps spanning approximately 6 seconds. Result preview and re-download link visible. Reference example sampled 8 frames, generated one candidate interval; observation and slow-push recipe were backed up to JSON, overwritten in UI, then restored via file chooser; original values and regenerated report observed. Unit suite: 13 JS + 8 Python. Real model provider, mobile and Docker remain unverified.

Additional browser checks: after a reload, loading demo restored the split three-clip draft. A multi-file chooser selected one valid MP4 and one deliberately invalid MP4; UI reported decode failure and preserved the existing 3-clip timeline.

## 2026-10-24 provider presets and zero-cost mode
Added independent text/vision provider choices: Zhipu, Kimi, DeepSeek, Doubao and custom compatibility. Official documentation checked. UI has explicit zero-cost banner and disabled model/test controls. Actual preview selected DeepSeek text and Zhipu vision; configuration template updated; no external model call was made. Backend defaults ALLOW_MODEL_CALLS=0 and blocks remote sends before urllib is invoked. Tests verify all four routes with mocked responses, no-key leaks, missing vision configuration, unknown provider rejection and HTTP error mapping. Zero-cost guard tested for plan/analyze/test with configured mock keys; no provider network requests made. Suite: 13 JS + 15 Python = 28 passing tests. No real provider credential or model invocation verified.

## 2026-10-25 local coach and caption fix
18 JS + 15 Python tests passed. Desktop preview: demo → preflight shows valid 2-clip timeline; tutorial template generated 4 clips across 8 seconds, with placeholder/density suggestions. Setting first end=9 produced one blocking issue; reverting to 2 cleared it. A 173-character first caption exported successfully to VP9 1280×720 + Opus, 234 video frames. FFmpeg full decode passed. Extracted 0.8-second frame visibly includes the final marker 结尾核对词 over five lines; old three-line truncation removed. Reload + demo restored four clips; downloaded JSON contains script, seconds and goal fields. No remote model requests. Mobile remains unverified.

## 2026-10-25 creative and teaching implementation
Actual preview exported an 8-second 1280x720 VP9/Opus creative draft with generated topic copy, fade and push effects; 236 video frames. Preview exported a 9-second early pacing version of the teaching video: VP9 960x540, 266 frames, full FFmpeg decode passed, sampled frame visibly includes the source frame, step 2/3, scale 100%→108% and inference limitations. Final teaching pacing now allocates 4–12 seconds per step based on text length (unit tested); final source also consumes short tails rather than generating sub-0.5-second ending flashes.
Browser file chooser timed out while testing automatic upload and the browser subsequently stopped responding; no browser recovery evidence was available. Automatic upload trigger and final blogger-attribution workflow have static/unit checks only and remain unverified in browser. No claim of platform crawling or real model analysis. Reference links are user-supplied provenance, not fetched content.

## 2026-10-25 采集与字幕更新验收
- 37 项 JS +16 项 Python 通过；新增采集文件防伪、容量/去重、备份、扩展 API 模拟、SRT 时间对齐与错误文件测试。
- 静态结构检查：116 个唯一 ID，本地资源与模块、关键控件引用完整。
- 参考视频重新加载清除旧文案，避免跨作品误用。
- 新浏览器复测被基础设施阻塞：cua_repl.js_reset 300 秒超时。按 troubleshooting 停止重复调用，不把自动化单测当浏览器/平台验收。
- 尚不能声称全需求完成：未批量同步账号、未语义挑选精彩片段、未识别全部效果、未录制剪映真实操作、未发布 GitHub Pages。

## 画面优选与多作品统计
- 45 项 JS +16 项 Python 通过。画面评分、区间映射、取消清理、同来源统计有测试；抽帧 DOM/媒体事件为模拟，未冒充浏览器实测。
- 采集器批量链接测试执行真实注入函数的模拟页面，验证隐藏项/外域/重复项过滤及导入结构。
- 自检功能在访客浏览器运行真实 MP4 解码与 1 秒 WebM 编码回读，但本轮尚未在可控浏览器中执行。
- 导出失去前台停止，不再继续录制可能缺帧的结果。
- 既有浏览器基础设施持续失败，未发现恢复证据，未重试。外部权限和视觉模型缺口仍在 README 如实标注。

## 本地视觉模型集成
- 47 项 JS +27 项 Python 共74项通过；新增本地服务器实际 HTTP 往返，推理返回仍为测试夹具。模型输入、时间戳、重复/越界/超时长、Host/Origin/令牌、默认禁用与云模型拒绝有测试。
- 实际运行启动器确认本机未安装 Ollama 时明确退出，不下载或调用云服务。
- 当前没有本地模型可做真实推理；浏览器控制没有恢复证据，未冒充已完成 UI 和模型质量验收。
- 本地发行包提供启动脚本和安装说明，源码包保留 GitHub Pages workflow；均排除运行密钥、模型权重、Git/Sites 私有状态。
- 全账号授权同步、真实剪映录屏教学、GitHub Pages 发布仍未完成，安装说明与 README 明确披露。

## GitHub Skill 入口
- 仅渲染文字，不解释 Markdown HTML，不 eval、不动态安装或运行仓库脚本。
- 来源链接限定官方 GitHub HTTPS域名，拒绝凭证、路径穿越与伪造域名；固定 commit 后读取主说明。GitHub API限流和文件大小失败会提示上传文件。
- 普通 Skill 仅传入本地视觉AI，明确未加载其附加资源；ClipPilot显式参数块可以真实改变规则粗剪设置与文案。
- 方案、JSON和草稿记录 Skill应用来源；本地推理仍校验真实抽帧、边界、总时长和重叠，不因Skill放宽。
- 当前没有浏览器基础设施恢复证据，未重试持续超时的接口。未完成浏览器视觉验收与真实模型质量验收。

## 用户截图对应的导入缺陷
- 用户截图仍显示 DEMO FOOTAGE。代码确实在已有时间线时跳过自动初稿构建，且原预览仍指向第一份示例素材。
- 已改成显式替换/追加流程；默认替换，立即切换到新视频预览，并重建初稿。
- 导入状态上移到上传按钮旁，解码失败不再静默；新增当前页导入前项目恢复。
- 61项JS测试通过，含5项新增导入回归；相关媒体事件为模拟，未当成真实用户视频实测。
