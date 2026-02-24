# TeachFlow LMS – Diagnostic Report

## Summary

The project starts and serves both frontend and backend locally. The main functional issues found during runtime verification were:

- MongoDB connectivity could be flaky on some Windows setups due to IPv6 (`localhost` → `::1`) resolution and because the server previously started listening before the DB connection finished.
- Gemini (AI) endpoints were failing because the configured API key is rejected by Google as invalid.

This report documents what was checked, what was changed, and how to verify stability.

## What Was Checked

### Startup & Logs

- Backend boot logs (Node/Express, MongoDB connect)
- Frontend dev server logs (Vite)
- Browser console logs (errors/warnings)

### Configuration

- `server/.env` (Mongo + OAuth + Gemini + YouTube + Python)
- `frontend/.env` (API base URL)
- CORS + session cookie settings

### Runtime Verification (Representative Scenarios)

- `/api/health` repeatedly (DB readiness stability)
- `/api/videos/:videoId/details`
- `/api/videos/:videoId/transcript`
- `/api/ai/summarize` (AI error handling)

## Issues Found & Fixes Implemented

### 1) Database Connectivity Robustness

**Symptoms**

- Some machines resolve `localhost` to IPv6 first; MongoDB may not be listening on `::1`, leading to intermittent connection delays/failures.
- Backend previously called `connectDB()` without awaiting it, so the HTTP server could start accepting traffic before the DB connection completed.

**Fix**

- Backend now awaits DB connection before starting to listen.
- Added retry logic (3 attempts) with clear logs.
- Added connection pool and timeout configuration.
- Forced IPv4 for local Mongo connections (and optionally via `MONGO_FORCE_IPV4=true`).
- Added health endpoint for DB state verification.

**Code**

- `server/src/utils/connectDB.js`
- `server/server.js`

**How to verify**

- Start the backend and open `http://localhost:8000/api/health`.
- Expect `db.readyState` to be `1` (connected).

### 2) AI (Gemini) Endpoints Failing

**Symptoms**

- `/api/ai/summarize` and `/api/ai/quiz` returned a generic error.
- Server logs show Google rejects the configured key as invalid.

**Fix**

- AI routes now return an actionable configuration error when the key is invalid.
- AI routes now accept a wider set of env var names to reduce misconfiguration:
  - Summary: `GEMINI_API_KEY_SUMMARY` or `SUMMARY_API_KEY` or `GOOGLE_API_KEY`
  - Quiz: `GEMINI_API_KEY_QUIZ` or `QUIZ_API_KEY` or `GOOGLE_API_KEY`

**Code**

- `server/src/routes/aiRoutes.js`

**How to verify**

- Call `/api/ai/summarize` with a small transcript.
- If the key is invalid, the response includes remediation steps.
- If the key is valid, the response includes a `summary`.

## Preventive Measures

### Secrets Safety

- Do not commit `.env` files.
- Rotate any secrets that were exposed outside of your local machine.
- Prefer platform environment variables (Render/Netlify/etc.) over repository secrets.

### Operational Checks

- Use `/api/health` as a quick diagnostic for DB readiness.
- If you run Mongo locally on Windows and see connection issues, set:
  - `MONGO_FORCE_IPV4=true`
  - or use `mongodb://127.0.0.1:27017/<db>` instead of `mongodb://localhost:27017/<db>`

### Suggested Monitoring

- Log DB connected/disconnected events.
- Fail fast in production if `MONGO_URI` is missing.

