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
