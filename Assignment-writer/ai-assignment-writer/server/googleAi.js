const https = require('node:https');
const { getTargetWordRange } = require('./contentQuality');

const postJson = (url, body, { timeoutMs }) => {
    return new Promise((resolve, reject) => {
        const req = https.request(
            url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body)
                }
            },
            (res) => {
                const chunks = [];
                res.on('data', (d) => chunks.push(d));
                res.on('end', () => {
                    const raw = Buffer.concat(chunks).toString('utf8');
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(raw);
                        return;
                    }
                    reject(new Error(`HTTP ${res.statusCode}: ${raw}`));
                });
            }
        );

        req.on('error', reject);
        req.setTimeout(timeoutMs, () => {
            req.destroy(new Error('Request timeout'));
        });

        req.write(body);
        req.end();
    });
};

const extractGeminiText = (json) => {
    const text = json?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join('\n') || '';
    return typeof text === 'string' ? text.trim() : '';
};

const generateImagePrompt = async ({ apiKey, topic, subject, sectionTitle, level, style, variantSeed }) => {
    if (!apiKey) return { ok: false, value: null, reason: 'missing_key' };

    const prompt = [
        'Write ONE concise image prompt for an educational illustration.',
        'No quotation marks. No markdown. No lists.',
        'It must be unique and visually specific (composition, objects, style).',
        `Topic: ${topic}`,
        `Subject: ${subject}`,
        `Section: ${sectionTitle}`,
        `Audience: ${level}`,
        `Writing style: ${style}`,
        `Variation seed: ${variantSeed}`
    ].join('\n');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(apiKey)}`;
    const body = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            maxOutputTokens: 80
        }
    });

    try {
        const raw = await postJson(url, body, { timeoutMs: 6000 });
        const text = extractGeminiText(JSON.parse(raw));
        if (!text) return { ok: false, value: null, reason: 'empty' };
        return { ok: true, value: text };
    } catch (e) {
        return { ok: false, value: null, reason: e?.message || 'error' };
    }
};

const generateAssignmentContent = async ({ apiKey, topic, subject, level, length, style, includeImages, imageCount, pages, instructions, language, englishVariant, seed, references, citationStyle, model }) => {
    if (!apiKey) return { ok: false, value: null, reason: 'missing_key' };

    const range = getTargetWordRange({ pages, level, style });
    const styleLower = String(style || '').toLowerCase();
    const concise = styleLower === 'direct and concise' || styleLower === 'direct_and_concise' || styleLower === 'concise';

    const imageInstruction = includeImages 
        ? `You MUST include exactly ${imageCount} image markers. Place them at relevant points in the text (e.g., after a section header).
           Format: [IMAGE: SECTION_TITLE="<Exact Section Title>" || KEYWORDS="<3 simple visual nouns, comma-separated>" || DESCRIPTION="<Short description>"]` 
        : 'Do NOT include any image markers.';

    const languageInstruction = language && language !== 'English' && language !== 'EnglishUK'
        ? `Write all explanatory text in ${language}. Keep Markdown headings (H1/H2/H3) and any image markers exactly in English. Do NOT write English sentences in the body paragraphs.`
        : (englishVariant === 'UK'
            ? 'Write in English using British spelling and punctuation.'
            : 'Write in English.');

    const referenceInstruction = references
        ? `Include a final H2 section "References" formatted in ${citationStyle || 'APA'} style using 3–6 real, widely known sources (official documentation, standard textbooks). Do NOT invent DOIs or page numbers.`
        : 'Do NOT include a References section unless explicitly requested.';

    const prompt = [
        `ROLE: You are an expert academic writer.`,
        `TASK: Write a ${length} assignment (approx ${pages} pages) on the topic "${topic}" in the subject of ${subject}.`,
        `PARAMETERS:`,
        `- Audience Level: ${level}`,
        `- Writing Style: ${style}`,
        `- Language: ${language || 'English'}`,
        `- Variation seed: ${seed || 0}`,
        instructions ? `- User Instructions: ${instructions}` : '',
        '',
        `REQUIREMENTS:`,
        `- Structure: Use Markdown (H1 title, H2 sections, H3 subsections). Include H2 headings: "Abstract", "Introduction", "Main Body", and "Conclusion".`,
        `- Body writing: One main idea per paragraph; follow a PEEL-style flow without labeling it (Point → Evidence/example → Explanation → Link/transition).`,
        `- Flow: Use connecting words (however, therefore, consequently, in contrast) to link paragraphs.`,
        `- Balance: Introduction ~10–15%, Main Body ~70–80%, Conclusion ~10–15% of total words.`,
        `- Paragraphing: keep paragraphs short (2–5 sentences). Split large paragraphs into smaller ones.`,
        `- Readability: include at least 2 bullet lists in the Main Body (e.g., steps, pros/cons, key points).`,
        `- Emphasis: include 1 short blockquote (>) labeled "Key takeaway" somewhere in the Main Body.`,
        `- Avoid repetition: do not reuse the same key-terms list or the same example across sections.`,
        `- Images: ${imageInstruction}`,
        `- Language: ${languageInstruction}`,
        `- References: ${referenceInstruction}`,
        `- Length: Target ${range.target} words; must be between ${range.min} and ${range.max} words.`,
        concise
            ? `- Concise mode: short paragraphs, clear claims, no fluff, no invented quotes or fake statistics.`
            : `- Quality: avoid generic filler and repetition; do not invent named sources, DOIs, or page numbers.`,
        '',
        `OUTPUT FORMAT:`,
        `- Start directly with the Title (H1).`,
        `- Do NOT output any "System" or "Meta" text like "Here is the assignment".`,
        `- Do NOT include meta text about tone/structure (no "Depth Mode", no "Tone is").`
    ].join('\n');

    const modelName = model || process.env.GOOGLE_TEXT_MODEL || 'gemini-1.5-pro-latest';
    const fallbackModel = 'gemini-flash-latest';

    const attempt = async (name) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(name)}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const body = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.5,
                topP: 0.95,
                maxOutputTokens: 8192
            }
        });
        const raw = await postJson(url, body, { timeoutMs: 70000 });
        const text = extractGeminiText(JSON.parse(raw));
        if (!text) throw new Error('empty');
        return text;
    };

    try {
        const text = await attempt(modelName);
        return { ok: true, value: text };
    } catch (e) {
        if (modelName !== fallbackModel) {
            try {
                const text = await attempt(fallbackModel);
                return { ok: true, value: text };
            } catch (e2) {
                return { ok: false, value: null, reason: e2?.message || e?.message || 'error' };
            }
        }
        return { ok: false, value: null, reason: e?.message || 'error' };
    }
};

module.exports = {
    generateImagePrompt,
    generateAssignmentContent
};
