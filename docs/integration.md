# Teach Flow Integration: CV Maker + Assignment Writer

## What Was Integrated
- **Teach Flow (main)**: React (Vite) frontend + Express backend.
- **CV Maker**: Static HTML/CSS/JS app embedded inside Teach Flow.
- **Assignment Writer**: React UI merged into Teach Flow frontend with a unified backend API mounted on Teach Flow server.

## User-Facing Routes
- Teach Flow (existing): unchanged
- CV Maker:
  - `/cv-maker` (Teach Flow page embedding the CV Maker static app)
- Assignment Writer:
  - `/assignment-writer` (home)
  - `/assignment-writer/form`
  - `/assignment-writer/jobs/:jobId` (live progress)
  - `/assignment-writer/result` (preview/export)

## Backend API Routes
Assignment Writer endpoints are now served by the Teach Flow backend under:
- `/api/assignment-writer/jobs` (create job)
- `/api/assignment-writer/jobs/:jobId` (get job snapshot + optional result)
- `/api/assignment-writer/jobs/:jobId/events` (SSE progress stream)
- `/api/assignment-writer/jobs/:jobId/cancel`
- `/api/assignment-writer/jobs/:jobId/retry-images`
- `/api/assignment-writer/jobs/:jobId/resolve-no-images`
- `/api/assignment-writer/jobs/:jobId/upload-images`
- `/api/assignment-writer/download/pdf`
- `/api/assignment-writer/download/docx`

## Key Code Changes (High-Level)
- CV Maker:
  - Copied the CV Maker static project under `frontend/public/cv-maker/`
  - Added Teach Flow route/page wrapper that embeds it via iframe
  - Removed the hard-coded Gemini API key from the CV Maker AI helper (user can provide their own key)
- Assignment Writer (frontend):
  - Ported the Assignment Writer React UI into `frontend/src/assignmentWriter/`
  - Added scoped styling so it doesn’t override Teach Flow’s global layout/styles
  - Replaced hard-coded `http://localhost:5000` API calls with `VITE_API_URL` + `/api/assignment-writer`
  - Added navigation items in the Teach Flow navbar
- Assignment Writer (backend):
  - Added a new router mounted at `/api/assignment-writer` in the Teach Flow server
  - Increased Express JSON body limit to support base64 image payloads

## Configuration / Environment Variables
The Assignment Writer backend uses the same environment system as the Teach Flow server.

Recommended variables:
- `PORT` (Teach Flow backend port)
- `CLIENT_URL` (for CORS)
- `GOOGLE_API_KEY` (required for text generation via Google model in Assignment Writer)
- `IMAGE_PROVIDER` (optional, defaults to `auto`)
- `IMAGE_API_KEY` (optional, depending on the provider)

## Python Requirements (Export)
Assignment export uses Python scripts to generate `.pdf` and `.docx`:
- Python must be available on PATH as `python`
- Python packages required:
  - `reportlab`
  - `python-docx`

If Python (or required packages) is missing, `/download/pdf` and `/download/docx` will fail.

## Run / Verify
Frontend:
- Install deps in `frontend/`
- Build the app (or run dev server)

Backend:
- Ensure Teach Flow backend env vars are set (Mongo, sessions, auth, and Assignment Writer keys if needed)
- Start the Teach Flow backend

Manual checks:
- Navbar shows **CV Maker** and **Assignment Writer**
- `/cv-maker` loads the CV Maker UI inside Teach Flow
- `/assignment-writer` → generate assignment → watch `/jobs/:jobId` progress → view `/result` → export PDF/DOCX

