# Server

## Environment

Copy `.env.example` to `.env`.

- For Google image generation: set `GOOGLE_API_KEY` and keep `IMAGE_PROVIDER=auto` (or set `IMAGE_PROVIDER=google`).
- For `sk-*` keys: set `IMAGE_API_KEY` and set `IMAGE_PROVIDER=auto` (or `IMAGE_PROVIDER=openai`).

## Image generation strategy

The server generates assignment text and inserts `[IMAGE: ...]` markers into the markdown. If images are enabled, it then tries to generate images from Google and returns them as `data:image/...` strings in the API response.

If Google image generation fails because of billing/quota limits, the server returns an `imageGeneration` status describing the failure, and the client will display fallback images (remote placeholders) instead.

To avoid repeatedly calling the Google image API when the project is currently rate-limited, the server stores an in-memory cooldown (`blockedUntil`). During the cooldown it will skip image generation and return `imageGeneration.status = "quota_blocked"`.

## Monitoring

`GET /api/monitoring/image-generation` returns in-memory counters plus the current quota cooldown status. This endpoint does not expose secrets.
