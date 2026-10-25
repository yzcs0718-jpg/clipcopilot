---
name: edit-video
description: Plan, validate, render and structurally review videos from existing footage with ClipPilot. Use for short videos, product demonstrations, script-to-shot edits, captions, MP4 export, video breakdown guidance and connecting a personal AI agent to planning APIs.
---
# ClipPilot video workflow

Collect local source files, aspect ratio, desired length and approved copy. Preserve originals. Never claim visual understanding without actually viewing footage or frames. Use ffprobe for media metadata.

Run the pipeline with the bundled script (Python 3, ffmpeg and ffprobe required):

```sh
python3 scripts/agent.py clip1.mp4 clip2.mp4 --output output.mp4 --ratio 16:9 --seconds 3
```

Use `--plan plan.json` for an approved browser-exported timeline, `--script script.md` for one caption/shot per non-heading line, or `--api https://your-private-backend.example --brief "goal"` for text-model planning. These modes are mutually exclusive. Set APP_TOKEN only in the environment for API mode. Local draft and script modes use deterministic rules, not a language model.

Add `--burn-captions` to burn approved captions into MP4. Install a suitable CJK font when burning Chinese. Always produce matching SRT, `.plan.json`, and `.agent.json` sidecars. Reject existing outputs rather than overwriting them. The pipeline runs inspect → planner → validator → renderer → reviewer. The reviewer checks dimensions, duration and audio stream presence, not creative quality or lip sync. Manually inspect playback before promising visual quality.

Use plans shaped as `{"clips":[{"asset":0,"start":0,"end":5,"caption":"approved copy"}]}`. Asset indices correspond to the positional source files. Times are source seconds. Validate integer indices, finite time ranges and captions up to 200 characters.

For individual rendering without the pipeline:

```sh
python3 scripts/render.py plan.json output.mp4 clip1.mp4 clip2.mp4 --ratio 16:9 --burn-captions
```

Read `references/api.md` when connecting the host AI or a private backend. Keep provider keys out of web pages, version control and command arguments. Ask before sending sensitive reference frames externally. The web workbench supports local editing, candidate shot segmentation, reference notes and optional vision-model analysis; the bundled CLI does not perform autonomous visual scene understanding.

Distinguish supported execution from unavailable services: Seedance generation, TTS and automatic speech transcription are not integrated. A visual model sees sampled frames and supplied text, not the full video or original editing project. Never claim to have reproduced exact proprietary effects from static frames.
