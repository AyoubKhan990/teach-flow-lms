const https = require('node:https');

const postJson = (url, body, { timeoutMs, headers }) => {
    return new Promise((resolve, reject) => {
        const req = https.request(
            url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                    ...(headers || {})
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

const postBinary = (url, body, { timeoutMs, headers }) => {
    return new Promise((resolve, reject) => {
        const req = https.request(
            url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                    ...(headers || {})
                }
            },
            (res) => {
                const chunks = [];
                res.on('data', (d) => chunks.push(d));
                res.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ buffer, contentType: res.headers['content-type'] });
                        return;
                    }
                    const errorText = buffer.toString('utf8');
                    reject(new Error(`HTTP ${res.statusCode}: ${errorText}`));
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

const extractImagen = (json) => {
    const prediction =
        json?.predictions?.[0] ||
        json?.prediction?.[0] ||
        json?.candidates?.[0] ||
        null;

    const base64 =
        prediction?.bytesBase64Encoded ||
        prediction?.image?.bytesBase64Encoded ||
        prediction?.imageBytes ||
        prediction?.output?.[0]?.bytesBase64Encoded ||
        null;

    const mimeType =
        prediction?.mimeType ||
        prediction?.image?.mimeType ||
        prediction?.outputMimeType ||
        'image/png';

    if (!base64 || typeof base64 !== 'string') return null;
    return { base64, mimeType };
};

const extractGeminiInlineImage = (json) => {
    const parts = json?.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
        const data = part?.inlineData?.data;
        if (typeof data === 'string' && data.length > 0) {
            const mimeType = part?.inlineData?.mimeType || 'image/png';
            return { base64: data, mimeType };
        }
    }
    return null;
};

const generateWithGeminiImageModel = async ({ apiKey, prompt, aspectRatio }) => {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';
    const body = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseModalities: ['IMAGE'],
            imageConfig: {
                aspectRatio
            }
        }
    });

    const raw = await postJson(url, body, { timeoutMs: 60000, headers: { 'x-goog-api-key': apiKey } });
    const parsed = JSON.parse(raw);
    const extracted = extractGeminiInlineImage(parsed);
    if (!extracted) return { ok: false, value: null, reason: 'empty' };
    return { ok: true, value: `data:${extracted.mimeType};base64,${extracted.base64}` };
};

const extractOpenAiB64 = (json) => {
    const b64 = json?.data?.[0]?.b64_json;
    if (typeof b64 !== 'string' || b64.length === 0) return null;
    return { base64: b64, mimeType: 'image/png' };
};

const generateWithOpenAiImageModel = async ({ apiKey, prompt }) => {
    // Use dall-e-3 if possible, or dall-e-2
    const url = 'https://api.openai.com/v1/images/generations';
    const body = JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt.substring(0, 4000), // DALL-E 3 limit
        size: '1024x1024',
        response_format: 'b64_json',
        n: 1
    });
    const raw = await postJson(url, body, {
        timeoutMs: 60000,
        headers: {
            Authorization: `Bearer ${apiKey}`
        }
    });
    const parsed = JSON.parse(raw);
    const extracted = extractOpenAiB64(parsed);
    if (!extracted) {
        // Fallback to DALL-E 2 if DALL-E 3 fails or not available (though error handling here is basic)
         return { ok: false, value: null, reason: parsed?.error?.message || 'empty' };
    }
    return { ok: true, value: `data:${extracted.mimeType};base64,${extracted.base64}` };
};

const generateWithHuggingFaceModel = async ({ apiKey, prompt }) => {
    // using black-forest-labs/FLUX.1-schnell
    const url = 'https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell';
    const body = JSON.stringify({
        inputs: prompt,
        parameters: {
            negative_prompt: 'text, watermark, logo, bad quality, distorted, ugly',
        }
    });

    const { buffer, contentType } = await postBinary(url, body, {
        timeoutMs: 60000,
        headers: {
            Authorization: `Bearer ${apiKey}`
        }
    });

    const base64 = buffer.toString('base64');
    const mimeType = contentType || 'image/jpeg';
    return { ok: true, value: `data:${mimeType};base64,${base64}` };
};

const generateImageDataUri = async ({ provider = 'auto', apiKey, prompt, aspectRatio = '4:3' }) => {
    if (!apiKey) return { ok: false, value: null, reason: 'missing_key' };
    if (!prompt || typeof prompt !== 'string') return { ok: false, value: null, reason: 'invalid_prompt' };

    const selectedProvider =
        provider === 'auto'
            ? apiKey.startsWith('sk-')
                ? 'openai'
                : apiKey.startsWith('hf_')
                    ? 'huggingface'
                    : 'google'
            : provider;

    console.log(`[IMAGE] Using provider: ${selectedProvider} for image generation`);

    if (selectedProvider === 'huggingface') {
        try {
            console.log('[IMAGE] Attempting Hugging Face generation...');
            return await generateWithHuggingFaceModel({ apiKey, prompt });
        } catch (e) {
            console.error('[IMAGE] Hugging Face generation failed:', e?.message || e);
            return { ok: false, value: null, reason: e?.message || 'error' };
        }
    }

    if (selectedProvider === 'openai') {
        try {
            console.log('[IMAGE] Attempting OpenAI DALL-E 3 generation...');
            return await generateWithOpenAiImageModel({ apiKey, prompt });
        } catch (e) {
            console.error('[IMAGE] OpenAI generation failed:', e?.message || e);
            return { ok: false, value: null, reason: e?.message || 'error' };
        }
    }

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict';
    const body = JSON.stringify({
        instances: [{ prompt }],
        parameters: {
            sampleCount: 1,
            aspectRatio
        }
    });

    try {
        const raw = await postJson(url, body, { timeoutMs: 60000, headers: { 'x-goog-api-key': apiKey } });
        const parsed = JSON.parse(raw);
        const extracted = extractImagen(parsed);
        if (!extracted) return { ok: false, value: null, reason: 'empty' };
        return { ok: true, value: `data:${extracted.mimeType};base64,${extracted.base64}` };
    } catch (e) {
        const reason = e?.message || 'error';
        const imagenBlocked =
            typeof reason === 'string' &&
            (reason.includes('Imagen API is only accessible to billed users') ||
                reason.includes('models/imagen') ||
                reason.includes('NOT_FOUND') ||
                reason.includes('PERMISSION_DENIED'));

        if (imagenBlocked) {
            try {
                return await generateWithGeminiImageModel({ apiKey, prompt, aspectRatio });
            } catch (e2) {
                return { ok: false, value: null, reason: e2?.message || reason };
            }
        }

        return { ok: false, value: null, reason };
    }
};

module.exports = {
    generateImageDataUri
};
