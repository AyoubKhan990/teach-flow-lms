## Current Repo Reality (What’s Already Here)
- Teach Flow is a React+Vite+Tailwind SPA in [frontend](file:///c:/Users/HP/Desktop/Teach%20Flow(LMS)/frontend) with routing in [App.jsx](file:///c:/Users/HP/Desktop/Teach%20Flow(LMS)/frontend/src/App.jsx) and the top nav in [Navbar.jsx](file:///c:/Users/HP/Desktop/Teach%20Flow(LMS)/frontend/src/components/navbar/Navbar.jsx).
- Teach Flow backend is an Express (ESM) server in [server](file:///c:/Users/HP/Desktop/Teach%20Flow(LMS)/server).
- CV Maker is a static HTML/CSS/JS app in [CV Maker](file:///c:/Users/HP/Desktop/Teach%20Flow(LMS)/CV%20Maker).
- Assignment-writer is a separate fullstack app in [Assignment-writer](file:///c:/Users/HP/Desktop/Teach%20Flow(LMS)/Assignment-writer) with:
  - React+Vite client
  - Express (CommonJS) server including SSE job progress and Python export scripts

## Integration Strategy (Minimize Breakage, Maximize “Single Interface”)
### 1) CV Maker
- Treat CV Maker as a self-contained static micro-app to avoid CSS collisions (it styles body/layout heavily).
- Move its files under Teach Flow frontend static hosting (Vite public) so it’s served from the same origin.
- Add a Teach Flow route `/cv-maker` that renders an iframe pointing at `/cv-maker/index.html`.

### 2) Assignment-writer
- Integrate Assignment-writer UI into Teach Flow SPA under a route prefix `/assignment-writer/*`.
- Preserve its functionality while preventing global style overrides by scoping its design tokens/utilities to a wrapper class (no body/global CSS changes).
- Merge Assignment-writer backend endpoints into the Teach Flow backend as `/api/assignment-writer/*` so there’s only one backend process.

## Code Integration Work (What I’ll Change)
### A) Frontend (Teach Flow)
- Create new pages:
  - `src/pages/CvMaker/CvMaker.jsx` (iframe wrapper with full-height layout)
  - `src/pages/AssignmentWriter/*` (routes mapping to imported Assignment-writer pages)
- Copy Assignment-writer client code into Teach Flow under something like:
  - `src/features/assignmentWriter/...` (components, features, pages)
- Update Teach Flow route table in [App.jsx](file:///c:/Users/HP/Desktop/Teach%20Flow(LMS)/frontend/src/App.jsx) to add:
  - `/cv-maker`
  - `/assignment-writer`, `/assignment-writer/form`, `/assignment-writer/jobs/:jobId`, `/assignment-writer/result`
- Update navbar in [Navbar.jsx](file:///c:/Users/HP/Desktop/Teach%20Flow(LMS)/frontend/src/components/navbar/Navbar.jsx):
  - Add “CV Maker” and “Assignment Writer” items, placed logically (after Dashboard or near Learning tools).
- Fix hardcoded API URLs in Assignment-writer client (currently `http://localhost:5000/...`) to use Teach Flow’s `VITE_API_URL` and new backend prefix:
  - `${import.meta.env.VITE_API_URL}/api/assignment-writer/...`
- Add missing frontend dependencies to Teach Flow `frontend/package.json` (used by Assignment-writer UI):
  - `react-markdown`, `remark-gfm`
- Add a scoped stylesheet for Assignment-writer:
  - `assignment-writer.css` with `.assignment-writer { --color-... }` and `.assignment-writer .text-step-*`, `.glass-panel`, `.surface`, etc.

### B) Backend (Teach Flow)
- Create a new router mounted from [server.js](file:///c:/Users/HP/Desktop/Teach%20Flow(LMS)/server/server.js):
  - `app.use('/api/assignment-writer', assignmentWriterRouter)`
- Port Assignment-writer server code into Teach Flow backend in an ESM-compatible structure:
  - Extract endpoints from [Assignment-writer server/index.js](file:///c:/Users/HP/Desktop/Teach%20Flow(LMS)/Assignment-writer/ai-assignment-writer/server/index.js) into an exported Express Router.
  - Move/port supporting modules (generator, jobs, image pipeline, feedback store, python services) into `server/src/assignmentWriter/`.
  - Keep SSE endpoint working (`/jobs/:jobId/events`) with correct headers.
  - Ensure JSON payload limit (50mb) is applied for the assignment-writer routes.
- Keep secrets safe:
  - Do not log API keys; only log safe high-level metadata.
- Document required env vars:
  - `IMAGE_PROVIDER`, `IMAGE_API_KEY`, `GOOGLE_API_KEY` (and anything generator needs).
- Document Python prerequisites for export:
  - Python available on PATH
  - `reportlab` and `python-docx` installed

## Navigation Implementation (User Experience)
- Navbar entries:
  - “CV Maker” → `/cv-maker`
  - “Assignment Writer” → `/assignment-writer`
- Ensure route transitions don’t break existing pages and the main layout stays consistent.
- For CV Maker iframe page, keep Teach Flow header/nav visible and make iframe scroll independently.

## Testing / Verification (What I’ll Run and What I’ll Validate)
- Frontend:
  - `npm run build` and `npm run lint` in `frontend`
  - Manual navigation smoke test: Home → CV Maker → back → Assignment Writer → back → existing pages
- Backend:
  - Start Teach Flow backend and hit:
    - `POST /api/assignment-writer/jobs` then `GET /api/assignment-writer/jobs/:id`
    - `GET /api/assignment-writer/jobs/:id/events` (SSE)
    - `POST /api/assignment-writer/download/pdf|docx` (requires Python deps)
- Functionality checks:
  - Assignment generation succeeds
  - Job progress UI updates correctly (polling + SSE)
  - Download returns a file
  - Existing Teach Flow endpoints (feed/playlists/ai routes) still work

## Deliverables
- Integrated Teach Flow SPA exposing all 3 tools from one UI (Teach Flow + CV Maker + Assignment Writer).
- Updated navbar + routes.
- Integration documentation (new `docs/integration.md`) covering:
  - what moved where
  - env vars
  - Python requirements
  - how to run/build

If you approve this plan, I’ll implement it end-to-end (frontend + backend + docs) and then run a full build + smoke tests.