const test = require('node:test');
const assert = require('node:assert/strict');

const { generateImagesForContent, parseRetryDelaySeconds, getQuotaStatus } = require('../imagePipeline');

test('parseRetryDelaySeconds extracts retryDelay from JSON-like reason', () => {
    const reason = 'HTTP 429: { "error": { "details": [ { "@type": "type.googleapis.com/google.rpc.RetryInfo", "retryDelay": "57s" } ] } }';
    assert.equal(parseRetryDelaySeconds(reason), 57);
});

test('getQuotaStatus detects quota exceeded and billing required', () => {
    assert.equal(getQuotaStatus('RESOURCE_EXHAUSTED Quota exceeded for metric'), 'quota_exceeded');
    assert.equal(getQuotaStatus('Imagen API is only accessible to billed users at this time.'), 'billing_required');
});

test('generateImagesForContent returns invalid_key for unknown key format', async () => {
    const payload = {
        topic: 'AI',
        subject: 'CS',
        includeImages: true,
        imageCount: 1,
        images: []
    };

    const content = '[IMAGE: SECTION_TITLE="Intro" || KEYWORDS="ai" || DESCRIPTION="Diagram"]';

    const { generatedImages, imageGeneration } = await generateImagesForContent({
        payload,
        content,
        seed: 123,
        provider: 'auto',
        apiKey: 'not-a-real-key',
        generateImageDataUri: async () => ({ ok: true, value: 'data:image/png;base64,abc' }),
        quotaState: {}
    });

    assert.deepEqual(generatedImages, []);
    assert.equal(imageGeneration.status, 'invalid_key');
    assert.equal(imageGeneration.attempted, false);
});

test('generateImagesForContent accepts sk-* keys in auto provider mode', async () => {
    const payload = {
        topic: 'AI',
        subject: 'CS',
        includeImages: true,
        imageCount: 1,
        images: []
    };

    const content = '[IMAGE: SECTION_TITLE="Intro" || KEYWORDS="ai" || DESCRIPTION="Diagram"]';

    const { generatedImages, imageGeneration } = await generateImagesForContent({
        payload,
        content,
        seed: 123,
        provider: 'auto',
        apiKey: 'sk-fake-openai-key-12345',
        generateImageDataUri: async () => ({ ok: true, value: 'data:image/png;base64,openai_image' }),
        quotaState: {}
    });

    assert.equal(imageGeneration.status, 'ok');
    assert.equal(generatedImages[0], 'data:image/png;base64,openai_image');
});

test('generateImagesForContent blocks repeated quota failures', async () => {
    const quotaState = {};
    const payload = {
        topic: 'AI',
        subject: 'CS',
        includeImages: true,
        imageCount: 2,
        images: []
    };

    const content = [
        '[IMAGE: SECTION_TITLE="A" || KEYWORDS="ai" || DESCRIPTION="Diagram A"]',
        '[IMAGE: SECTION_TITLE="B" || KEYWORDS="ai" || DESCRIPTION="Diagram B"]'
    ].join('\n');

    const quotaReason =
        'HTTP 429: {"error":{"status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"14s"}]}}';

    const first = await generateImagesForContent({
        payload,
        content,
        seed: 123,
        provider: 'google',
        apiKey: 'AIzaTestKey',
        generateImageDataUri: async () => ({ ok: false, reason: quotaReason }),
        quotaState
    });

    assert.equal(first.imageGeneration.status, 'quota_exceeded');
    assert.equal(first.imageGeneration.retryAfterSeconds, 14);
    assert.ok(typeof quotaState.blockedUntil === 'number' && quotaState.blockedUntil > Date.now());

    const second = await generateImagesForContent({
        payload,
        content,
        seed: 123,
        provider: 'google',
        apiKey: 'AIzaTestKey',
        generateImageDataUri: async () => ({ ok: true, value: 'data:image/png;base64,abc' }),
        quotaState
    });

    assert.equal(second.imageGeneration.status, 'quota_blocked');
    assert.equal(second.imageGeneration.attempted, false);
    assert.deepEqual(second.generatedImages, []);
});

test('generateImagesForContent accepts sk-* keys in auto provider mode', async () => {
    const payload = {
        topic: 'AI',
        subject: 'CS',
        includeImages: true,
        imageCount: 1,
        images: []
    };
    const content = '[IMAGE: SECTION_TITLE="Intro" || KEYWORDS="ai,ml" || DESCRIPTION="Block diagram of an AI system"]';

    let called = 0;
    const { generatedImages, imageGeneration } = await generateImagesForContent({
        payload,
        content,
        seed: 123,
        provider: 'auto',
        apiKey: 'sk-test-key',
        generateImageDataUri: async ({ provider }) => {
            called += 1;
            return { ok: true, value: `data:image/png;base64,${provider}` };
        },
        quotaState: {}
    });

    assert.equal(called, 1);
    assert.equal(imageGeneration.attempted, true);
    assert.equal(imageGeneration.status, 'ok');
    assert.equal(generatedImages.length, 1);
});
