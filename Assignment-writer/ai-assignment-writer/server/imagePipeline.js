const extractImageMarkers = (content) => {
    if (typeof content !== 'string' || content.length === 0) return [];
    const matches = content.matchAll(/\[IMAGE:\s*(.*?)\]/g);
    return Array.from(matches, (m) => (typeof m?.[1] === 'string' ? m[1] : '')).filter(Boolean);
};

const parseMarker = (raw) => {
    const sectionTitle = raw.match(/SECTION_TITLE="([^"]+)"/)?.[1] || '';
    const keywords = raw.match(/KEYWORDS="([^"]+)"/)?.[1] || '';
    const description = raw.match(/DESCRIPTION="([^"]+)"/)?.[1] || raw;
    return { sectionTitle, keywords, description };
};

const getQuotaStatus = (reason) => {
    const text = typeof reason === 'string' ? reason : '';
    if (text.includes('only accessible to billed users')) return 'billing_required';
    if (text.includes('HTTP 429') || text.includes('Too Many Requests') || text.toLowerCase().includes('rate limit')) {
        return 'quota_exceeded';
    }
    if (text.includes('RESOURCE_EXHAUSTED') || text.includes('Quota exceeded') || text.includes('generate_content_free_tier')) {
        return 'quota_exceeded';
    }
    return null;
};

const parseRetryDelaySeconds = (reason) => {
    const text = typeof reason === 'string' ? reason : '';
    const retryDelayJson = text.match(/"retryDelay"\s*:\s*"(\d+)s"/);
    if (retryDelayJson) return Number.parseInt(retryDelayJson[1], 10) || null;
    const retryIn = text.match(/retry in\s+(\d+(\.\d+)?)s/i);
    if (retryIn) return Math.ceil(Number.parseFloat(retryIn[1])) || null;
    return null;
};

const createImageGenerationState = (provider) => ({
    provider: provider || 'google',
    attempted: false,
    generated: 0,
    errors: [],
    status: 'idle',
    retryAfterSeconds: null
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const shouldRetryReason = (reason) => {
    const text = typeof reason === 'string' ? reason.toLowerCase() : '';
    if (!text) return true;
    if (text.includes('request timeout')) return true;
    if (text.includes('timeout')) return true;
    if (text.includes('temporarily unavailable')) return true;
    if (text.includes('econnreset') || text.includes('socket hang up')) return true;
    if (text.includes('network') && text.includes('error')) return true;
    return false;
};

const isLikelyApiKey = (apiKey) => {
    if (typeof apiKey !== 'string') return false;
    // Allow Google keys (AIza...) or OpenAI keys (sk-...)
    if (apiKey.startsWith('AIza')) return true;
    if (apiKey.startsWith('sk-')) return true;
    if (apiKey.startsWith('hf_')) return true;
    return false;
};

const generateImagesForContent = async ({
    payload,
    content,
    seed,
    provider = 'auto',
    apiKey,
    generateImageDataUri,
    quotaState,
    retry,
    onProgress
}) => {
    const imageGeneration = createImageGenerationState();
    const uploadedImages = Array.isArray(payload?.images) ? payload.images : [];
    const requested = payload?.includeImages ? Number(payload?.imageCount || 0) : 0;
    const toGenerate = Math.max(0, requested - uploadedImages.length);

    const maxAttempts = Math.max(1, Number(retry?.maxAttempts || 1));
    const baseDelayMs = Math.max(0, Number(retry?.baseDelayMs || 0));

    if (!payload?.includeImages || requested === 0) {
        return { generatedImages: [], imageGeneration };
    }

    if (!apiKey) {
        imageGeneration.status = 'missing_key';
        imageGeneration.errors.push({ 
            index: 0, 
            reason: 'No API key configured. Please set GOOGLE_API_KEY or IMAGE_API_KEY in your .env file.' 
        });
        return { generatedImages: [], imageGeneration };
    }

    if (!isLikelyApiKey(apiKey)) {
        imageGeneration.status = 'invalid_key';
        imageGeneration.errors.push({ 
            index: 0, 
            reason: 'Invalid API key format. Expected Google AI key (AIza...) or OpenAI key (sk-...)' 
        });
        return { generatedImages: [], imageGeneration };
    }

    if (quotaState?.blockedUntil && Date.now() < quotaState.blockedUntil) {
        imageGeneration.status = 'quota_blocked';
        imageGeneration.retryAfterSeconds = Math.max(1, Math.ceil((quotaState.blockedUntil - Date.now()) / 1000));
        return { generatedImages: [], imageGeneration };
    }

    const markers = extractImageMarkers(content);
    if (markers.length === 0 || toGenerate === 0) {
        imageGeneration.status = 'no_markers';
        return { generatedImages: [], imageGeneration };
    }

    imageGeneration.attempted = true;
    imageGeneration.status = 'attempted';

    const startIndex = Math.min(uploadedImages.length, markers.length);
    const eligible = markers.slice(startIndex, startIndex + toGenerate);

    const generatedImages = [];

    for (let i = 0; i < eligible.length; i++) {
        const markerIndex = startIndex + i;
        const parsed = parseMarker(eligible[i]);
        const prompt = [
            'Create a high-quality educational illustration.',
            'No text, no watermarks, no logos.',
            `Topic: ${payload.topic}`,
            `Subject: ${payload.subject}`,
            parsed.sectionTitle ? `Section: ${parsed.sectionTitle}` : '',
            parsed.keywords ? `Keywords: ${parsed.keywords}` : '',
            `Variation: ${seed + markerIndex}`
        ]
            .filter(Boolean)
            .join('\n');

        let finalFailureReason = null;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            if (typeof onProgress === 'function') {
                onProgress({
                    done: i,
                    total: eligible.length,
                    message: attempt === 1 ? `Creating image ${i + 1} of ${eligible.length}…` : `Retrying image ${i + 1} (attempt ${attempt}/${maxAttempts})…`,
                    meta: { index: markerIndex, attempt, maxAttempts }
                });
            }

            const img = await generateImageDataUri({
                provider,
                apiKey,
                prompt,
                aspectRatio: '4:3'
            });

            if (img?.ok) {
                generatedImages.push(img.value);
                imageGeneration.generated = generatedImages.length;
                if (typeof onProgress === 'function') {
                    onProgress({
                        done: i + 1,
                        total: eligible.length,
                        message: `Created image ${i + 1} of ${eligible.length}.`,
                        meta: { index: markerIndex, attempt, ok: true }
                    });
                }
                finalFailureReason = null;
                break;
            }

            const reason = img?.reason || 'error';
            const quotaStatus = getQuotaStatus(reason);
            if (quotaStatus) {
                imageGeneration.status = quotaStatus;
                const retryAfterSeconds = parseRetryDelaySeconds(reason);
                if (retryAfterSeconds) imageGeneration.retryAfterSeconds = retryAfterSeconds;
                if (quotaState) {
                    quotaState.lastFailureReason = quotaStatus;
                    quotaState.lastFailureAt = Date.now();
                    quotaState.blockedUntil = Date.now() + (retryAfterSeconds ? retryAfterSeconds * 1000 : 60_000);
                }
                imageGeneration.errors.push({ index: markerIndex, reason });
                finalFailureReason = null;
                break;
            }

            finalFailureReason = reason;
            const retryable = shouldRetryReason(reason);
            if (attempt < maxAttempts && retryable && baseDelayMs > 0) {
                const wait = Math.round(baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 250);
                await sleep(wait);
                continue;
            }
        }

        if (finalFailureReason) {
            imageGeneration.errors.push({ index: markerIndex, reason: finalFailureReason });
        }

        if (imageGeneration.status === 'quota_exceeded' || imageGeneration.status === 'quota_blocked' || imageGeneration.status === 'billing_required') {
            break;
        }
    }

    if (imageGeneration.status === 'attempted' && generatedImages.length > 0) imageGeneration.status = 'ok';
    if (imageGeneration.status === 'attempted' && generatedImages.length === 0 && imageGeneration.errors.length > 0) {
        imageGeneration.status = 'failed';
    }

    return { generatedImages, imageGeneration };
};

module.exports = {
    generateImagesForContent,
    extractImageMarkers,
    parseMarker,
    getQuotaStatus,
    parseRetryDelaySeconds
};

