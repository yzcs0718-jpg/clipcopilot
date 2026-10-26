# Browser model and sample attribution

All model inference runs in browser CPU workers. Public model/runtime files are downloaded on explicit use; source frames are not submitted to a hosted inference service. No API keys or paid inference APIs are used. Models may be cached by the browser.

- PaddlePaddle PP-OCRv5 mobile detection and recognition ONNX models, Apache-2.0. Official repositories: https://huggingface.co/PaddlePaddle/PP-OCRv5_mobile_det_onnx and https://huggingface.co/PaddlePaddle/PP-OCRv5_mobile_rec_onnx . Pinned revisions and URLs are in `dist/paddle-ocr-worker.js`.
- `dist/paddle-characters.json` is the CTC character dictionary from the recognition model's `inference.yml`, revision `ed152b8b495f84de93cda5709d768548a9127622`, with CTC blank/space entries. Copyright PaddlePaddle contributors; Apache-2.0. License copy: `dist/licenses/APACHE-2.0.txt`.
- MediaPipe Selfie Segmentation, ONNX Community conversion by Xenova/Hugging Face, Apache-2.0: https://huggingface.co/onnx-community/mediapipe_selfie_segmentation . Revision `be49485c8e027524be38591817fc5cd31bd9d00e`. This is newly generated foreground estimation, not identification of the editing method used in a finished video.
- Ultra-Light-Fast-Generic-Face-Detector-1MB (UltraFace), MIT, Linzaer contributors: https://github.com/Linzaer/Ultra-Light-Fast-Generic-Face-Detector-1MB . Model revision `0f9ca4a9fc80170fd505168fd1132b837141f7df`. License copy: `dist/licenses/UltraFace-LICENSE.txt`. Used only for face-presence gating; no identity recognition.
- ONNX Runtime Web 1.22.0, Microsoft contributors, MIT: https://github.com/microsoft/onnxruntime . Runtime loaded from jsDelivr.
- Optional person self-test fetches the public MediaPipe test asset https://storage.googleapis.com/mediapipe-assets/portrait.jpg . It is not included in the repository, not used as evidence about an uploaded video and not an accuracy benchmark. Original test reference: https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/python/solutions/selfie_segmentation_test.py .
- Original `spatial-fixture.mp4` contains only geometric patterns and text drawn by the provided generator. The generator requires an external Noto CJK font, under SIL Open Font License, https://github.com/notofonts/noto-cjk . Font files are not bundled.

The site does not download or execute third-party editing scripts. Detection candidates and reproduction instructions do not prove original effects, proprietary presets, fonts, hidden backgrounds or project parameters.
