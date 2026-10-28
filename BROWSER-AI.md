# 浏览器模型进展与验收边界

## 本次可验证功能

- 声音分类：浏览器解码原视频音轨，转为16kHz单声道，每5秒交给 `Xenova/ast-finetuned-audioset-10-10-0.4593`，展示前三个候选标签及原始模型分数。分数不是准确率，不能断言声音属于后期，也不能定位具体音效库。
- 语音转录：使用 `Xenova/whisper-tiny` 在浏览器CPU分块转录，保留返回时间；结果需要校对，不自动覆盖已填文案。
- 模型通过固定版本 `@huggingface/transformers@3.8.1` 运行。首次点击会从 jsDelivr 下载运行库、从 Hugging Face 下载模型。音轨、采样图片与模型输入不发送给推理API。不使用密钥、不回退到收费服务；需要可访问依赖的网络和足够内存。

## 实测证据

1. 实际加载了 SmolVLM-256M 的 ONNX 模型并在浏览器 WASM CPU 后端进行推理。第一次输出重复、无效结构；第二次输出未遵循要求、包含可疑细节的自然语言描述。校验拒绝采用，两次都没有算作效果识别成功。
2. 实际导入内置4秒 MP4 的 AAC 音轨并运行 AST 模型，返回 `Sine wave` 0.961、`Beep, bleep` 0.022、`Dial tone` 0.004。该示例为合成测试音轨，只能证明这次端到端运行，不能得出一般识别准确率。
3. 实际下载官方公开 `jfk.wav` 并运行 Whisper tiny，返回对应英文语音和0–11秒区间。没有测试中文口播或混合音轨质量。
4. 98项前端测试通过，其中模型字段与时间引用校验使用固定测试数据；单元测试不是模型质量验收。

## 未达标

完整的转场、变速、字幕动画、蒙版、抠像、跟踪、调色、叠加识别尚未验收。浏览器视觉模型保留为折叠的研究入口，明确标为质量测试未通过，不能宣传为“任意视频、每个效果准确识别”。即使换更大的模型，也不能唯一反推原工程、插件、模板或参数。

公开网站仍提供基础像素检测候选与手动学习步骤，两者与视觉模型识别结论分开。音轨检测、转录均为用户主动点击；声音识别不会给图片模型充当音轨证据。

## 使用

上传参考视频后，进入拉片结果中的「浏览器音轨分析」。点击「分析音效候选」或「转录原声」，首次会下载对应模型。等待状态完成后校对结果，可通过「下载拉片报告」保存已完成分段的音轨分析。更换视频会清除旧音轨结果。

若想单独检查语音模型，可在页面底部「遇到导入或导出问题？运行浏览器自检」中点击「语音模型免费自检」。此自检只使用官方公开语音样本，不分析项目素材。

模型网络下载或设备兼容失败会显示具体错误；不把失败改写为分析结果。

## 官方参考

- https://huggingface.co/docs/transformers.js/guides/webgpu
- https://huggingface.co/Xenova/ast-finetuned-audioset-10-10-0.4593
- https://huggingface.co/Xenova/whisper-tiny
- https://huggingface.co/HuggingFaceTB/SmolVLM-500M-Instruct


## 2026-10-26: whole-video evidence and OCR

The public app now keeps a nine-category coverage ledger. `待确认` is not an absence finding. Masking, cutout, tracking, exact grading, speed curves, blending modes and original presets remain unrecognized. This is not acceptance of the complete “any video / every effect” requirement.

- Added temporal candidates for short white flashes and static runs bordered by motion. Camera flash, inserted white footage and static source assets remain alternative explanations. Sampling boundaries are approximate.
- Added Tesseract.js 6.0.1, core 6.0.0, `chi_sim` language model (includes Latin), browser WASM only. Public engine/model files are downloaded; source frames stay in the browser. No paid inference service is used. Three overlapping horizontal regions improve segmentation. At most 120 timestamps, approximately one per second for short videos. This will miss short text/animations.
- English fixture passed; **Chinese self-test failed**, even after segmentation changes. UI explicitly discloses this. Do not market Chinese recognition as verified. First full-frame OCR attempts failed the English video too; regional OCR was required. Low-confidence raw output is available separately and is not adopted as a lesson.
- OCR line content/boxes produce only position/size reproduction suggestions, not font, animation-preset, mask or tracking identification. Repeated text can be in the photographed scene rather than added subtitles.
- Teaching defaults to the detected evidence list. Unknown categories no longer silently become generic hard-cut lessons. Manual recipes remain a separate explicit choice. It still produces reference-frame and text instruction video, **not a real screen recording of 剪映**.

### Reproducible original fixture

`dist/demo/effects-fixture.mp4` is original, programmatically generated geometric footage. No third-party or personal media. Source generator: `tools/make_effect_fixture.py` (requires Pillow, ffmpeg and the referenced system font).

Ground truth: 7 seconds, fade 0–0.5s, white interval 1.0–1.2s, static interval 3.0–4.0s, moving English caption `CUT TO THE BEAT`, sine audio. The detector does not read these ground-truth values; the same native video scan is used as with uploaded files.

Actual Chrome UI tests on the local preview:

- 43 video samples; fade candidate 0–0.50s.
- White-flash candidate bracket 0.83–1.33s, white samples 1.00 and 1.17s. This is not an exact reconstruction of 1.0–1.2s.
- Static-run candidate 3.00–3.83s (last sampled static frame, not the true 4.0s endpoint).
- Regional OCR recognized the English caption in all seven sampled timestamps, 0.50–6.50s, and joined it into one position-change candidate. It estimated horizontal centers about 40% → 51%.
- Cancelled OCR during engine startup: explicit stopped status, analysis button enabled again; no late result replaced it.
- Exported selected-interval evidence teaching: real 28.016s MP4, decoded 960×540 video, VP9 codec in the available Chrome environment. No audio stream. Inspected an extracted frame: it contains white-flash opacity instructions and evidence times. This does not prove universal MP4 codec compatibility.
- Automated JS suite: 106 passing tests. Unit cases test boundaries/no invented observations; these counts are not recognition accuracy.

The button “测试字幕 / 闪白 / 定格” loads this fixture through normal video decoding and scan. The app does not inject reference answers into detection or OCR.


## 2026-10-26: denser temporal sampling and model comparison

- Default reference scan increased from ~6fps / 600 frames to ~24fps / 3600 frames. A 7s clip now yields 169 samples. Long clips reduce density to honor the cap; the actual interval is disclosed. RGB frames use Uint8Array (6912 bytes per sample) instead of JS number arrays. Both segmentation and visual-evidence code accept packed pixels.
- Added scan cancellation. It rejects partial results and restores previous complete samples/shot results. Actual Chrome test: stopped a rescan, saw explicit stopped status, scan button reenabled, and previous 169-sample results remained.
- Static-run validation now checks 0.25s context and the total start/end difference. This keeps detection meaningful at higher sample rates and avoids calling slowly accumulating movement a freeze.
- OCR adds samples ±0.1/0.2s around candidate shot boundaries, up to 240 frames. Actual Chrome test yielded 12 input frames including a blank white-flash sample, then one correct English position-change track; uncertain shape-as-text output was not adopted.
- Replaced the small integer Chinese OCR model with official floating-point tessdata_best tag 4.1.0, via jsDelivr, about 13.1MB. Engine stays browser-local. Download source: https://cdn.jsdelivr.net/gh/tesseract-ocr/tessdata_best@4.1.0/chi_sim.traineddata . Uses separate model-cache namespace, not the old cached integer model.
- **Chinese still fails the same self-test**: raw output is closer but reads 剪辑节奏 incorrectly as 剪辑节夫. Do not call this accepted Chinese support. The expected answer is checked only by the self-test status, never injected into OCR results or lessons. The public UI retains the failure notice.

### Actual same-video temporal comparison

`dist/demo/short-flash-fixture.mp4`, generated with `tools/make_effect_fixture.py OUTPUT --short-flash`, contains exactly one full-white frame: decoded frame 32 at 30fps (about 1.067–1.100s). It has the same original geometric animation, fade and static interval as the longer-white fixture. No third-party media.

- Fast 6fps scan: 43 samples, did not detect that flash.
- Detailed 24fps scan: 169 samples, flash at sampled 1.083s, contextual bracket 1.042–1.125s. This is still a bracket, not exact original parameter reconstruction.
- Detailed static interval: 3.000–3.958s, versus 3.000–3.833s at 6fps.
- Both paths use the uploaded-file scanning implementation. Fixture ground truth is not read by the detector.
- JS suite: 111 tests pass, including packed RGB compatibility, bounded sampling, cut-boundary OCR allocation, high-fps static context, and rejection of slow movement as freeze. These are regression tests, not a real-world accuracy benchmark.

No improvement here establishes arbitrary masks, cutout, tracking, LUT identification or all-effects coverage.

## 2026-10-26: PP-OCRv5, geometric windows, gated person mattes and co-motion

This update is a working browser-local implementation of limited evidence and reproduction paths. It is not acceptance of arbitrary effect recognition, font/preset identification or original-project reconstruction.

### Browser inference

- Replaced Tesseract with official PaddlePaddle PP-OCRv5 mobile detector and recognizer, run by ONNX Runtime Web 1.22.0 / WASM CPU. Detection and CTC decoding use the real model outputs; no expected text is injected. Model revisions are pinned in `dist/paddle-ocr-worker.js`. A copy of the Apache-2.0 character dictionary from the official recognition model configuration is shipped as `paddle-characters.json`.
- Same formerly failing self-test image now reads both `CUT TO THE BEAT` and `剪辑节奏` correctly in the actual browser. The prior Tesseract failure remains documented above as history, not current capability.
- An original six-second MP4 with the same Chinese text in white outline, colored outline, and offset-shadow renderings was decoded through the normal reference pipeline. OCR returned the correct Chinese string at all six sampled timestamps, joined as one movement track. Color samples and possible edge colors are measured from actual pixels; their fill/outline role, font, width, preset and shadow parameters are NOT definitively identified.
- Google MediaPipe Tasks Vision was attempted but rejected for this environment: ESM importScripts incompatibility and unavailable WebGL service. Final code uses the ONNX Community conversion of MediaPipe Selfie Segmentation via WASM CPU instead, with a pinned revision.
- Initial segmentation falsely marked abstract geometry as people. That output was not accepted as reliable: an independent UltraFace face detector and face-center/matte consistency check were added. Final adoption requires face score >=0.98, meaningful matte area and a positive matte at the detected face center. Back views, hidden/small faces and arbitrary non-person subjects are therefore out of scope and remain unknown. Face presence detection does not identify the person.
- The original geometric video is a negative control: after gating, actual browser inference returned zero reliable person frames out of twelve. Google MediaPipe's official public portrait image is an independent positive self-test: actual browser inference produced a foreground matte. Its result is explicitly separate from uploaded-video findings. A successful self-test is not a real-world cutout-accuracy benchmark.

### Geometry and motion evidence

- Circle candidates combine smoothed edge votes, closed color-region validation, radial boundary support and interior spatial texture. At least three temporally consistent detections are required. Solid circles are tested as a negative control. Natural circular objects and stickers remain alternatives; arbitrary masks, feathering and occlusion are not inferred.
- Template features are measured across continuous frames. Text-box self-matches are excluded and approximate global translations are filtered before adopting a text/target co-motion candidate. No semantic target identity is claimed. Occlusions, low texture, repeated patterns and long sampling gaps can fail; co-motion can also come from manual keyframes or photographed text.
- Actual original fixture: circle center measured approximately 81% horizontally / 58% vertically, diameter 22% of video width; generator truth is 81.25% / 58.33%, diameter 21.875%. Whole-video result persisted across twelve sampled frames.
- Actual original fixture: text/independent-feature co-motion found from 0.50–5.50s, six paired observations; steps include measured text centers approximately 24% →39% horizontally at 31% vertically. They are reproduction suggestions, not proof of an automatic tracking tool.
- Spatial analysis samples up to 90 frames. Long videos are sparse and may not support tracking; lack of a candidate must not be read as absence of effects.

### UI and teaching

“深度拉片” runs OCR then spatial analysis sequentially with the existing media lock, visible progress, cancellation and no keys or paid API. New mask/motion evidence joins the nine-category report and the detected-evidence teaching. The cutout row says “已生成复现遮罩”, never “原片抠像已准确识别”. Matte PNGs can be downloaded locally. The official portrait self-test never updates the uploaded video's evidence ledger.

Each evidence item can generate its own MP4 teaching. Long instructions are split into readable segments instead of being silently clipped. These are reference-frame / text instructions, not actual 剪映 screen recordings.

Original fixture and generator: `dist/demo/spatial-fixture.mp4`, `tools/make_spatial_fixture.py`. The Noto CJK font must be supplied to the generator; it is not redistributed in the repository. No personal or third-party footage is embedded in that fixture. The official public portrait is fetched only for the independent self-test, not bundled.

Regression suite: 119 passing JS tests at this stage, including CTC, heatmap regions, matte bounds, textured-circle vs solid-circle controls, text self-match/global-motion rejection, blank-frame tracking and teaching text preservation. Unit counts are not model accuracy.

Final local preview export validation: the per-item circular-window button generated a real 16.987-second MP4, 960×540, VP9 in the available browser, no audio. Independently decoded with ffmpeg and visually inspected at 7 seconds: the frame contains the actual circle-window reference, 81%/58% center, 22%-width diameter and the corresponding three 剪映 steps. MP4 container success is not a claim of H.264 compatibility or a real 剪映 recording.


Final coordinator check: cancellation or failure of OCR now stops the depth-analysis pipeline instead of starting spatial models after a user cancellation. Actual browser test after loading the original fixture: stopped OCR, observed explicit depth-analysis stopped status and unchanged “spatial analysis not run” status. Two new stage-coordinator tests pass; final JS suite count is 121. Core Chinese/window/co-motion results were also verified on the deployed GitHub Pages site.

### Tracking reseeding and real reverse-search validation

Fixed two concrete limitations: tracking only seeded the first frame, and the old “reverse” test compared the identical pair of patches in reversed argument order (symmetric, therefore not an independent check). The tracker now reseeds throughout the sampled sequence, runs a separate reverse neighborhood search and requires a return within 1.5 pixels. Background displacement is measured over each candidate's actual time range instead of mixing whole-track displacements from different start times. Failed matches, dimension changes and gaps over 1.6 seconds break tracks. The UI explicitly shows supported time intervals; uncovered intervals are unknown, not “no tracking”.

Three added regressions: late target after blank opening; a deliberately similar nearby distractor that passes one-way similarity but fails reverse location; occlusion and discontinuity rejection. Full JS suite: 124 passed. Actual Chrome browser tests on original H.264 references: 6-second fixture retained Chinese text, one circle and one co-motion candidate (0.50–5.50s); new 8-second fixture with first 2 seconds blank produced reliable feature intervals 2.25–7.75s and Chinese co-motion 2.50–7.50s, zero person false positives. Both run the normal video decode/OCR/spatial pipeline; no expected answers are injected. Fixtures and their generators are original. No added models, paid calls or user installation.

Limitations unchanged: local patches can still fail on repeated textures, occlusion, deformation or fast motion; only near-global translation is excluded, not every camera transform. Circles remain geometric candidates; generated person mattes do not prove original cutout. Arbitrary Chinese effect text, masks, original cutout/tracking parameters and complete all-effects recognition remain unvalidated.

### Rectangular dynamic windows and circle false-positive correction

Added `window-shapes.js`: conservative connected-region geometry for full axis-aligned rectangles on a mostly uniform surrounding border. Four sides need strong contrast and background support; the interior must have spatial texture. Temporal adoption requires three distinct sampled frames and at least two measured interior-content changes; a solid card or static textured picture is not promoted to a dynamic-window candidate. Reports and per-item teaching include measured center/width/height, keyframe hints if position changes and explicit ambiguity with screens, physical frames and picture-in-picture crops. Evidence frames show the measured rectangular outline. This is candidate reproduction guidance, not original mask identification.

Actual browser testing exposed an older circle-detector false positive: striped rectangles produced four circle groups. Fixed by requiring local edge normals to align with candidate radii around the circumference, rather than accepting radial brightness differences alone. Also fixed same-frame duplicate circle detections counting as multiple temporal observations. Decoded H.264 regression: all twenty rectangle-fixture samples now have zero circle detections; all twelve original circle samples retain their circle. Actual Chrome runs confirm zero circles/one dynamic rectangle in the 10-second fixture, and one circle/zero dynamic rectangles in the 6-second original.

Original rectangle fixture: 0–2s solid card, 2–4s static texture, 4–8s changing texture at a new location, 8–10s blank. Normal browser decode, 20 spatial samples: one dynamic rectangle 4.25–7.75s, eight frames, seven content changes, center70%/51%, width30%, height44%. No person false positives. The static texture remains a single-frame geometric outline in evidence but does not enter the adopted dynamic-window lesson. Generator truth is not passed to detectors.

Actual per-item browser export: 26.0013s, 960×540, VP9 in MP4, no audio; independently decoded and visually inspected at12s with the source rectangle and correct70%/51%/30%/44% reproduction text. It is not a real 剪映 screen recording. Six additional regressions bring the JS suite to130 passing tests; counts are not accuracy claims. Current rectangle scope excludes rotated/arbitrary masks, complex surroundings, clipped edges, feathering and static-content windows. No additional model downloads or paid inference were added.

Publication cache follow-up: the first public deployment displayed the new fixture button but an older cached breakdown module had no handler. Added consistent release queries to every local module import, worker URL and HTML script/style entry; CI now stamps these using GITHUB_SHA before tests and Pages upload. Shared module URLs use the same version to preserve the media-task singleton. Local script validation checks worker/import/entry stamping, external-URL preservation and idempotency.

### Sample evidence review (local acceptance)

Removed the ten-image truncation from spatial evidence. All sampled frames, including negative/blank observations, are available in eight-frame pages and geometry/person filters. Shared image review modal overlays measured rectangles, aspect-correct circles, newly computed person bounds or exact-frame OCR boxes. Measurements can be hidden and the setting persists across sample navigation. Keyboard focus moves to the updated heading. The source-seek action validates finite in-range time, refuses while a media task holds the lock, pauses instead of autoplaying and clears segment-end playback state. New reference imports close the viewer and clear prior evidence.

Spatial analysis retains its actual low-resolution input plus a separate same-time clearer video frame (long side at most960px). Normalized measured bounds are drawn over that frame for review; it is not higher-resolution model inference. Selftests never expose a seek action into the user's source video. Pure tests cover coordinate clipping/rejection, geometry aspect mapping, all90 frames preserved across pages, filter/page clamping, and time validation. JS suite134 passed. Actual Chrome:20-frame rectangle fixture, three pages, last blank9.75s visible;4.25s source view640×360 versus240×135 detection; source seek4.75s paused=true. Chinese/circle fixture deep analysis retained Chinese text and circle/following candidates; actual OCR frame opens with measured Chinese box. Empty-person filter and restoration work; hidden markers remain hidden across navigation. This is local UI acceptance, not a new effect-recognition accuracy claim.

### Return-to-start text motion and focused OCR sampling

Fixed a concrete false negative: the old tracker only compared first/last bbox x/y/width. All observations now contribute to visible center displacement and width range; sampled turning nodes are retained with a budget of12. Center-based position avoids mislabeling centered scaling as translation. Output describes measured left/right/up/down reversals and widening/narrowing, never an original editor preset. Relative trial scale uses the first OCR width as100%; easing, opacity and rotation are not recovered.

Added bounded focused OCR: up to10 seconds at approximately6fps. Results transactionally replace only the selected interval and retain other observations and explicit per-frame sampling steps. Text missing from several consecutive dense samples breaks a track rather than borrowing a1-second base gap. Total merged budget240, preflight checked before model work; a new base run clears dense history. Partial-only runs explicitly report unexamined regions. Reference changes clear prior data, while model selftests do not get merged into user evidence.

Original H.264 fixture uses our existing rendered Chinese caption pixels, no third-party footage or font redistribution. Browser normal decode plus PaddleOCR: base4 frames produced one return-to-start/scale-reversal candidate; focused24/24 frames read “剪辑节奏”, one0.083–3.917s track with9 nodes. First center31%/48%, middle65%/48%, last33%/48%; trial width scale100%→147%→104%. Actual single-item browser teaching export completed107.014s,960×540,VP9 MP4,no audio. Frame inspection exposed a previous teaching bug: all steps used the starting reference even when text described a middle node. Fixed selection by validated leading step timestamps within the evidence interval; long split steps retain the same source time, and teaching labels show actual sampled frame time. Two regressions cover middle/end matches and split-step time preservation. JS suite144 passed; these remain limited fixture/regression results, not all-video accuracy.

## Upload-to-results flow repair (2026-10-27)
User video selection and the primary analyze button now run segmentation, OCR and spatial evidence automatically. The upload panel shows per-stage live status, retained failure reasons and a stop-all button. An independent OCR failure does not suppress spatial checks; a required segmentation failure or user cancellation prevents the next stage. The input clears after selection so selecting the same file triggers analysis again. Actual evidence rows open and contain OCR reproduction steps alongside spatial steps, which are reused without duplication in teaching. Optional audio model downloads remain opt-in and explicitly marked. Browser file-chooser verification: original6s spatial fixture imported twice, each automatically completed145 reference samples,6 OCR frames and12 spatial frames, yielding Chinese caption, circular window and text/local-target co-motion candidates. Stops/failures have unit regressions; real browser cancellation timing is not yet verified. JS suite148 passed. These checks do not establish arbitrary/all-effects accuracy.

## Bounded short inspection and comparison (2026-10-27)
Current JS suite153. Reuse completed OCR/spatial checks within the current reference session; no caching of failed/partial checks as success. Base sampling reuse requires the same source URL, density and threshold. Forced complete analysis bypasses reuse. No cross-refresh media persistence.
Focused temporal inspection is independent of the global sampling grid and cuts: max4s,60/120 seeks per second,480 samples; latest range replaces overlapping base temporal candidates. Dense frames are included in teaching. Original60fps FFmpeg pattern has one white source frame. Browser base25 samples missed it; focused121 observations found0.517–0.542s. Stop/retry and restored input verified in browser.
Comparison uses typed evidence parameters: source video on the left, a fixed source still with a fade/flash/scale/freeze simulation on the right; text uses a neutral background with measured center and width interpolation. Unsupported spatial reconstruction is disabled. No original layers are recovered, original effects are not removed, fixed stills do not reconstruct source motion, text font/preset is not recovered. Browser0.529s frame showed source and canvas white simultaneously. Seek boundary comparison includes a small floating-point tolerance. Video time updates and end events clamp playback to the padded evidence interval; close cancels pending reads and releases the media lock. No paid API or cloud video upload.

## Early usable results and bounded model stages (2026-10-28)
Suite155. Default base sampling now6 seeks/s, with24 still selectable and local short-effect inspection retained. Lower global density trades temporal coverage for fewer seeks; not a claim of unchanged recall. OCR and spatial runs each have45s default total deadlines, selectable300s. OCR aborts its signal and worker, spatial abort rejects pending RPCs and terminates its worker. No partial stage is committed as success. Timers are cleared on every exit. Browser real pipeline test: OCR8/12 frames at8s, navigation to existing how-to results remained enabled. Skip-current interrupted OCR and allowed spatial success; final2/3 complete, OCR clearly stopped. Exact budget/timer behavior has automated regression; full45s wall-clock browser expiration is not independently benchmarked. First whole-video analysis can still be slow; this change bounds model wait and exposes completed results earlier, not a global all-video latency guarantee.

## Base OCR checkpoints (2026-10-28)
Suite159. Successful base OCR observations survive abort/deadline as a partial result; coverage is a set of successful sampled instants, never a continuous processed interval. Reports and the nine-category audit mark partial n/m progress and unknown remaining times. Same-reference, same-plan retries skip only validated completed frame timestamps; changed source/plan cannot reuse them. The cache is session memory only, cleared on reference changes/refresh. Existing complete evidence is retained when a new attempt fails; pendingResume prevents treating that failed attempt as newly complete. Dense OCR and spatial stages do not yet checkpoint.
Real browser: original7s short-flash fixture,12 OCR planned samples. Skip after second frame began kept1/12 at0.50s with recognized text. Result-header retry began at second planned sample0.88s and completed12 observations; all3 stages then complete. No synthetic OCR outputs or expected fixture labels were injected. Partial extraction, timestamp validation, stale-plan rejection, report/audit wording and completion behavior have regressions.
