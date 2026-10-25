# Private API and host-agent integration

Use ClipPilot server/api.py. Set MODEL_BASE_URL (OpenAI-compatible root ending in /v1), MODEL_NAME, MODEL_API_KEY, APP_TOKEN (at least 24 random characters), ALLOWED_ORIGIN, and optionally VISION_MODEL_NAME. The server defaults to 127.0.0.1:8787; override HOST/PORT for your hosting environment and provide HTTPS for public access.

Authenticated routes use `Authorization: Bearer APP_TOKEN`:
- GET /api/health: reports backend health and presence of model configuration. It does not validate provider connectivity.
- POST /api/plan: `{brief, assets:[{name,duration}]}` → validated `{clips}`. Sends metadata only.
- POST /api/analyze: `{reference:{name,duration,width,height}, frames:[{time,image}], transcript, shots}` → `{analysis}`. Images must be JPEG data URLs; maximum 12. A vision-capable model is required. Obtain permission for reference data transmission.

Register these HTTP tools and the local `scripts/agent.py` entrypoint in your own AI host. The project's tools/agent-tools.json is a description to bind manually, not a running MCP server. The CLI is an executable staged pipeline; it is not a background autonomous service.

GitHub Pages hosts only the frontend. Deploy the Python API separately, set ALLOWED_ORIGIN to the actual page origin (no repository path), and keep model keys in server environment variables. Provider calls can incur the provider's charges. Do not expose arbitrary local paths or shell commands in a public API.
