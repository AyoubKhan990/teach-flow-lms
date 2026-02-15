## What’s Broken (Root Causes)
- **Export scripts can crash when encountering image markers**: both [generate_docx.py](file:///c:/Users/HP/Desktop/Assignment-writer/ai-assignment-writer/server/python_services/generate_docx.py) and [generate_pdf.py](file:///c:/Users/HP/Desktop/Assignment-writer/ai-assignment-writer/server/python_services/generate_pdf.py) call `urllib.parse.quote(...)` but don’t import `urllib.parse`. This can stop images from being embedded in DOCX/PDF.
- **Several form parameters are sent but not used**: the form sends fields like `pages`, `references`, `citationStyle`, `urgency`, `language`, etc. (see [Form.jsx](file:///c:/Users/HP/Desktop/Assignment-writer/ai-assignment-writer/client/src/pages/Form.jsx)), but the generator in [server/index.js](file:///c:/Users/HP/Desktop/Assignment-writer/ai-assignment-writer/server/index.js) only uses a subset. This makes it look like “parameters are ignored”.
- **Weak validation + type coercion**: `imageCount` comes from a `<select>` (string values). Without explicit coercion + clamping, edge cases like `includeImages=true` with `imageCount=0` or invalid values lead to unexpected output.
- **Images can look “the same”** because prompts repeat when section titles repeat (topic list cycles) and URLs can be identical/cached.

## Backend Fixes (Server)
- **Add request validation + coercion** in [server/index.js](file:///c:/Users/HP/Desktop/Assignment-writer/ai-assignment-writer/server/index.js)
  - Validate `topic` (required, trimmed), `subject`, `level`, `length`, `style` (must be allowed values).
  - Coerce `includeImages` to boolean.
  - Coerce `imageCount` to integer, clamp to 0–5.
  - Enforce rule: if `includeImages=true` and `imageCount<=0`, default to 1.
  - Normalize `instructions` to a string and trim.
  - Return 400 with clear messages when invalid.
- **Make every form parameter either used or removed**:
  - Implement behavior for `pages`, `references`, `citationStyle`, `urgency`, `language` (or remove them from the form if you don’t want them). 
  - Recommended mapping:
    - `length/pages` → controls section count + target word range.
    - `references/citationStyle` → toggles references block and formats it.
    - `urgency` → affects writing depth (brief vs thorough).
    - `language` → localize headings and/or phrasing.
- **Fix image prompt uniqueness + count correctness**:
  - Generate at most `imageCount` markers.
  - Make each prompt unique by including: section index + section title + subject + topic + desired style, so every marker produces a distinct URL.
  - Optionally add a stable cache-buster/seed per section if needed.

## Python Fixes (DOCX/PDF Export)
- **Fix the crash**: add `import urllib.parse` (or `from urllib.parse import quote`) in:
  - [generate_docx.py](file:///c:/Users/HP/Desktop/Assignment-writer/ai-assignment-writer/server/python_services/generate_docx.py)
  - [generate_pdf.py](file:///c:/Users/HP/Desktop/Assignment-writer/ai-assignment-writer/server/python_services/generate_pdf.py)
- **Improve formatting fidelity** (so exports match headings/lists):
  - DOCX: add parsing for ordered lists (`1.`) using Word’s `List Number` style; keep bullet lists; preserve bold/italics.
  - PDF: render headings with larger fonts; render bullet/numbered lists with indentation; keep paragraph spacing.
- **Honor `imageCount` and avoid repeats** in marker processing (already partially done, but will be aligned with the validated values).

## Frontend Fixes (Form + State)
- **Guarantee correct types and default values** in [Form.jsx](file:///c:/Users/HP/Desktop/Assignment-writer/ai-assignment-writer/client/src/pages/Form.jsx)
  - Ensure `imageCount` is stored as a number (parseInt on change).
  - When user toggles “Include Images” ON, auto-set `imageCount` to 1 if currently 0.
  - Do not silently overwrite `imageCount` when uploading images; instead define precedence:
    - Either: `imageCount = max(selectedCount, uploadedCount)`
    - Or: uploaded images count must equal the selected count (show validation error).
- **Better error handling UX**:
  - Show inline validation errors (topic missing, invalid imageCount, etc.) instead of generic alerts.

## Testing (Unit + Integration + Combination Coverage)
- **Backend unit tests** using Node’s built-in `node:test`:
  - Verify different combinations change output: subject/level/style/length/pages/instructions.
  - Verify marker count equals `imageCount` when `includeImages=true`, and 0 when false.
  - Verify validation returns 400 on invalid payloads.
- **Python integration tests**:
  - Feed content with `[IMAGE: ...]` markers and confirm DOCX/PDF generation completes (specifically catches the missing `urllib.parse` import).
  - Test fallback behavior (no internet → placeholder images).
  - Test uploaded image precedence (Base64 images included).
- **End-to-end API tests**:
  - POST `/api/generate` → assert response contains properly normalized parameters.
  - POST `/api/download/docx|pdf` → assert non-empty file buffer.

## Acceptance Criteria
- Every form parameter is either (a) applied to output deterministically, or (b) removed from UI/payload.
- Same input → same structure; changing any parameter produces a distinct, explainable output change.
- Image generation produces exactly `imageCount` images when enabled, each with a distinct prompt/URL.
- DOCX/PDF downloads embed images without crashing and show readable headings/lists.

If you confirm this plan, I’ll implement the fixes + tests in the codebase.