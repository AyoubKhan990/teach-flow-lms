The issue is that `loremflickr` defaults to cats (its default behavior) if the keywords are invalid, empty, or URL-encoded incorrectly (e.g., spaces causing 403 or being ignored). The "cat statue" in your screenshot is the default fallback image.

### **The Fix Plan**

1.  **Robust Keyword Extraction & Fallback:**
    *   **Frontend (`Result.jsx`)**: I will modify the keyword cleaning logic to:
        *   Ensure a default keyword (e.g., "technology" or "business") is *always* present if extraction fails.
        *   Replace spaces with commas, as `loremflickr` expects comma-separated tags or hyphenated ones, but spaces can break it.
    *   **Backend (`generate_docx.py`, `generate_pdf.py`)**: Apply the same robust logic (fallback to "technology" if empty, replace spaces).

2.  **Improve AI Prompt:**
    *   I will update the Google AI prompt to explicitly ask for **simple, single-word nouns** as keywords (e.g., "computer, robot" instead of "Advanced Artificial Intelligence"). This increases the chance of `loremflickr` finding a relevant image.

3.  **Use `picsum` as Secondary Fallback?**
    *   No, stick to `loremflickr` but use broad categories if specific ones fail. `picsum` is too random.

### **Step-by-Step Implementation**
1.  **Update `server/googleAi.js`**: Refine the prompt to ask for "3 simple, visual nouns" for keywords.
2.  **Update `client/src/pages/Result.jsx`**:
    *   Clean keywords: `replace(/\s+/g, ',')` (spaces to commas).
    *   Add hard fallback: `if (!keywords || keywords.length < 3) keywords = "technology,work,business";`
3.  **Update `server/python_services/*.py`**: Match the frontend logic.
4.  **Restart Server**: Apply changes.

This ensures you get "technology" images instead of "cats" even if the AI's specific keywords are weird.