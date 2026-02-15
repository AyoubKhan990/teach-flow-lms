### **Analysis of Image Reuse Issue**
You correctly suspected that the system is reusing images. Here is the technical breakdown:

1.  **The Root Cause (Caching by Lock ID):**
    *   Currently, the system generates a "Lock ID" for `loremflickr` using the formula: `1000 + imageIndex`.
    *   **Result:** The first image of *every single assignment* always uses `lock=1000`. The second always uses `lock=1001`.
    *   If you generate an assignment on "AI" today and "AI" tomorrow, `loremflickr` sees the same keywords + same lock ID, so it returns the **exact same cached image**.

2.  **The Solution (Unique Session Seeds):**
    *   We need to ensure that every time you click "Generate", a unique `seed` is created for that specific session.
    *   Formula change: `lock = (SessionSeed) + imageIndex`.
    *   This ensures that even if keywords are identical, the `lock` ID is different (e.g., `54921` vs `88102`), forcing `loremflickr` to find a new image.

### **Implementation Plan**

1.  **Server (`server/index.js`):**
    *   In the `/api/generate` endpoint, generate a random `seed` (e.g., `Math.floor(Math.random() * 100000)`) and attach it to the response `data`.

2.  **Frontend (`client/src/pages/Result.jsx`):**
    *   Read this `data.seed` from the server response.
    *   Update the image URL logic to use `data.seed + imgIndex` instead of the hardcoded `1000`.

3.  **Backend Download Scripts (`generate_docx.py`, `generate_pdf.py`):**
    *   Update these scripts to read the `seed` from the input JSON (passed from the frontend during download request).
    *   Use `seed + current_img` as the lock ID.

4.  **Verification:**
    *   I will verify this by generating two assignments with the same topic; they should now have completely different images.

This change guarantees that every "Generate" click produces a fresh set of images.