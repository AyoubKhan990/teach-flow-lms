const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env'), override: false });
dotenv.config({ path: path.join(__dirname, '.env'), override: false });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const { normalizeGeneratePayload, normalizeDownloadPayload, generateContent } = require('./generator');
const { generateImageDataUri } = require('./imagen');
const { generateImagesForContent } = require('./imagePipeline');
const { JobStore, runJob } = require('./jobs');
const { FeedbackStore } = require('./feedbackStore');

const IMAGE_PROVIDER = process.env.IMAGE_PROVIDER || 'auto';

const imageQuotaState = {
    blockedUntil: 0,
    lastFailureReason: null,
    lastFailureAt: null
};

const imageUsage = {
    generateRequests: 0,
    imageRequested: 0,
    imageAttempted: 0,
    imagesGenerated: 0,
    lastStatus: null,
    lastAttemptAt: null,
    lastRetryAfterSeconds: null
};

const jobStore = new JobStore({ ttlMs: 24 * 60 * 60 * 1000, maxEvents: 300 });
const feedbackStore = new FeedbackStore({ maxEntries: 500 });

const stripSurrogates = (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/[\uD800-\uDFFF]/g, '');
};

const sanitizeDownloadPayload = (data) => {
    const cleaned = { ...data };
    cleaned.topic = stripSurrogates(cleaned.topic);
    cleaned.subject = stripSurrogates(cleaned.subject);
    cleaned.level = stripSurrogates(cleaned.level);
    cleaned.length = stripSurrogates(cleaned.length);
    cleaned.style = stripSurrogates(cleaned.style);
    cleaned.language = stripSurrogates(cleaned.language);
    cleaned.urgency = stripSurrogates(cleaned.urgency);
    cleaned.citationStyle = stripSurrogates(cleaned.citationStyle);
    cleaned.instructions = stripSurrogates(cleaned.instructions);
    cleaned.content = stripSurrogates(cleaned.content);
    if (Array.isArray(cleaned.images)) cleaned.images = cleaned.images.map(stripSurrogates);
    return cleaned;
};

const getEffectiveProvider = ({ imageApiKey }) => {
    const keyBasedProvider =
        typeof imageApiKey === 'string' && imageApiKey.startsWith('sk-')
            ? 'openai'
            : typeof imageApiKey === 'string' && imageApiKey.startsWith('hf_')
                ? 'huggingface'
                : 'google';

    return IMAGE_PROVIDER === 'auto'
        ? 'auto'
        : IMAGE_PROVIDER === keyBasedProvider
            ? IMAGE_PROVIDER
            : 'auto';
};

app.get('/api/monitoring/image-generation', (req, res) => {
    const keyConfigured =
        IMAGE_PROVIDER === 'openai'
            ? Boolean(process.env.IMAGE_API_KEY)
            : IMAGE_PROVIDER === 'google'
                ? Boolean(process.env.GOOGLE_API_KEY)
                : Boolean(process.env.IMAGE_API_KEY || process.env.GOOGLE_API_KEY);

    res.json({
        ok: true,
        provider: IMAGE_PROVIDER,
        keyConfigured,
        quota: {
            blockedUntil: imageQuotaState.blockedUntil || 0,
            lastFailureReason: imageQuotaState.lastFailureReason,
            lastFailureAt: imageQuotaState.lastFailureAt
        },
        usage: imageUsage
    });
});

app.post('/api/feedback', (req, res) => {
    const jobId = typeof req.body?.jobId === 'string' ? req.body.jobId.trim() : '';
    const rating = Number(req.body?.rating);
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : '';
    const tags = Array.isArray(req.body?.tags) ? req.body.tags.filter((t) => typeof t === 'string' && t.length <= 32).slice(0, 10) : [];
    if (!jobId) return res.status(400).json({ ok: false, error: 'jobId is required' });
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) return res.status(400).json({ ok: false, error: 'rating must be 1..5' });

    feedbackStore.add({ jobId, rating, notes, tags });
    res.json({ ok: true });
});

app.get('/api/monitoring/feedback', (req, res) => {
    const limit = Number(req.query?.limit || 50);
    res.json({ ok: true, items: feedbackStore.recent(limit) });
});

app.post('/api/generate', async (req, res) => {
    try {
        const normalized = normalizeGeneratePayload(req.body);
        if (!normalized.ok) {
            return res.status(400).json({ success: false, errors: normalized.errors });
        }

        const payload = normalized.value;
        imageUsage.generateRequests += 1;
        imageUsage.imageRequested += payload.includeImages ? Number(payload.imageCount || 0) : 0;
        // Generate a unique seed for this assignment session to ensure unique images
        const seed = Math.floor(Math.random() * 100000) + 1;
        
        console.log(`[GENERATE] Request: Length=${payload.length}, Pages=${payload.pages}, Level=${payload.level}, Style=${payload.style}, Images=${payload.includeImages}, ImageCount=${payload.imageCount}, Topic=${payload.topic}, Seed=${seed}`);

        // Step 1: Generate content first
        const content = await generateContent(payload);
        console.log('[GENERATE] Content generation completed');

        // Step 2: Generate images only if content was generated successfully
        let generatedImages = [];
        let imageGeneration = {};
        
        if (payload.includeImages && payload.imageCount > 0) {
            console.log('[GENERATE] Starting image generation...');
            try {
                const imageApiKey = process.env.IMAGE_API_KEY || process.env.GOOGLE_API_KEY;
                const keyBasedProvider =
                    typeof imageApiKey === 'string' && imageApiKey.startsWith('sk-')
                        ? 'openai'
                        : typeof imageApiKey === 'string' && imageApiKey.startsWith('hf_')
                            ? 'huggingface'
                            : 'google';

                const effectiveProvider =
                    IMAGE_PROVIDER === 'auto'
                        ? 'auto'
                        : IMAGE_PROVIDER === keyBasedProvider
                            ? IMAGE_PROVIDER
                            : 'auto';

                const imageResult = await generateImagesForContent({
                    payload,
                    content,
                    seed,
                    provider: effectiveProvider,
                    apiKey: imageApiKey,
                    generateImageDataUri,
                    quotaState: imageQuotaState
                });

                generatedImages = imageResult.generatedImages;
                imageGeneration = imageResult.imageGeneration;
                
                console.log(`[GENERATE] Image generation completed: ${generatedImages.length} images generated, status: ${imageGeneration.status}`);
                
                // Update usage stats
                if (imageGeneration?.attempted) {
                    imageUsage.imageAttempted += 1;
                    imageUsage.lastAttemptAt = Date.now();
                    imageUsage.lastRetryAfterSeconds = imageGeneration.retryAfterSeconds || null;
                }
                imageUsage.imagesGenerated += Array.isArray(generatedImages) ? generatedImages.length : 0;
                imageUsage.lastStatus = imageGeneration?.status || null;
            } catch (error) {
                console.error('[GENERATE] Image generation failed:', error);
                imageGeneration = {
                    status: 'failed',
                    errors: [{ reason: error.message }],
                    generated: 0,
                    attempted: true
                };
            }
        }

        console.log('[GENERATE] Assignment generation completed successfully');
        console.log(`[GENERATE] Summary: ${generatedImages.length}/${payload.imageCount} images generated, content length: ${content.length} characters`);

        res.json({
            success: true,
            data: {
                ...payload,
                seed, // Pass seed to frontend
                generatedImages,
                imageGeneration,
                content
            }
        });
    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate assignment' });
    }
});

app.post('/api/jobs', async (req, res) => {
    const normalized = normalizeGeneratePayload(req.body);
    if (!normalized.ok) {
        return res.status(400).json({ ok: false, errors: normalized.errors });
    }

    const payload = normalized.value;
    console.log(`[JOB_CREATE] ${JSON.stringify({ topic: payload.topic, subject: payload.subject, level: payload.level, length: payload.length, style: payload.style, pages: payload.pages, language: payload.language, englishVariant: payload.englishVariant, references: payload.references, citationStyle: payload.citationStyle, includeImages: payload.includeImages, imageCount: payload.imageCount })}`);
    const job = jobStore.create({ payload });
    const seed = Math.floor(Math.random() * 100000) + 1;
    jobStore.update(job.id, { seed });
    jobStore.emit(job.id, { stage: 'queued', message: 'Job created', percent: 0 });

    const imageApiKey = process.env.IMAGE_API_KEY || process.env.GOOGLE_API_KEY;
    const effectiveProvider = getEffectiveProvider({ imageApiKey });

    runJob({
        jobId: job.id,
        store: jobStore,
        generateContent,
        generateImagesForContent,
        seed,
        quotaState: imageQuotaState,
        apiKey: imageApiKey,
        provider: effectiveProvider,
        generateImageDataUri
    });

    res.json({ ok: true, job: { id: job.id } });
});

app.get('/api/jobs/:jobId', (req, res) => {
    const job = jobStore.get(req.params.jobId);
    if (!job) return res.status(404).json({ ok: false, error: 'Job not found' });

    const snapshot = {
        id: job.id,
        status: job.status,
        stage: job.stage,
        message: job.message,
        percent: job.percent,
        attempt: job.attempt,
        maxAttempts: job.maxAttempts,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        warning: job.warning || null,
        error: job.error || null,
        lastEventSeq: job.seq
    };

    const result = job.status === 'completed' ? {
        ...job.payload,
        seed: job.seed,
        content: job.content || '',
        generatedImages: Array.isArray(job.generatedImages) ? job.generatedImages : [],
        imageGeneration: job.imageGeneration || { status: 'idle', attempted: false, generated: 0, errors: [] }
    } : null;

    res.json({ ok: true, job: snapshot, result });
});

app.get('/api/jobs/:jobId/events', (req, res) => {
    const jobId = req.params.jobId;
    const job = jobStore.get(jobId);
    if (!job) return res.status(404).end();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    jobStore.addSseClient(jobId, res);

    const snapshot = {
        id: job.id,
        status: job.status,
        stage: job.stage,
        message: job.message,
        percent: job.percent,
        attempt: job.attempt,
        maxAttempts: job.maxAttempts,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        warning: job.warning || null,
        error: job.error || null,
        lastEventSeq: job.seq
    };

    res.write(`event: snapshot\ndata: ${JSON.stringify({ job: snapshot })}\n\n`);
    for (const evt of job.events) {
        res.write(`event: progress\ndata: ${JSON.stringify(evt)}\n\n`);
    }

    const heartbeat = setInterval(() => {
        try {
            res.write(`:keepalive ${Date.now()}\n\n`);
        } catch {
        }
    }, 15000);

    req.on('close', () => {
        clearInterval(heartbeat);
        jobStore.removeSseClient(jobId, res);
        try {
            res.end();
        } catch {
        }
    });
});

app.post('/api/jobs/:jobId/cancel', (req, res) => {
    const job = jobStore.get(req.params.jobId);
    if (!job) return res.status(404).json({ ok: false, error: 'Job not found' });
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        return res.json({ ok: true, job: { id: job.id, status: job.status } });
    }
    jobStore.update(job.id, { cancelled: true, status: 'cancelled', stage: 'cancelled', message: 'Cancelled' });
    jobStore.emit(job.id, { stage: 'cancelled', message: 'Cancelled', percent: job.percent || 0 });
    res.json({ ok: true, job: { id: job.id, status: 'cancelled' } });
});

app.post('/api/jobs/:jobId/resolve-no-images', (req, res) => {
    const job = jobStore.get(req.params.jobId);
    if (!job) return res.status(404).json({ ok: false, error: 'Job not found' });
    if (!job.content) return res.status(400).json({ ok: false, error: 'Content not ready' });

    job.payload = { ...job.payload, includeImages: false, imageCount: 0, images: [] };
    jobStore.update(job.id, {
        generatedImages: [],
        imageGeneration: { status: 'skipped', attempted: false, generated: 0, errors: [] },
        warning: null,
        status: 'completed',
        stage: 'completed',
        message: 'Completed (without images)',
        percent: 100
    });
    jobStore.emit(job.id, { stage: 'completed', message: 'Completed (without images)', percent: 100 });
    res.json({ ok: true });
});

app.post('/api/jobs/:jobId/upload-images', (req, res) => {
    const job = jobStore.get(req.params.jobId);
    if (!job) return res.status(404).json({ ok: false, error: 'Job not found' });

    const images = Array.isArray(req.body?.images) ? req.body.images : [];
    const sanitized = images.filter((s) => typeof s === 'string' && s.startsWith('data:image/')).slice(0, 5);
    if (sanitized.length === 0) return res.status(400).json({ ok: false, error: 'No valid images provided' });

    const nextImageCount = Math.max(Number(job.payload?.imageCount || 0), sanitized.length);
    job.payload = { ...job.payload, includeImages: true, imageCount: nextImageCount, images: sanitized };
    jobStore.update(job.id, {
        warning: null,
        status: 'completed',
        stage: 'completed',
        message: 'Completed (with uploaded images)',
        percent: 100,
        imageGeneration: { status: 'uploaded_only', attempted: true, generated: 0, errors: [] }
    });
    jobStore.emit(job.id, { stage: 'completed', message: 'Completed (with uploaded images)', percent: 100 });
    res.json({ ok: true });
});

app.post('/api/jobs/:jobId/retry-images', async (req, res) => {
    const job = jobStore.get(req.params.jobId);
    if (!job) return res.status(404).json({ ok: false, error: 'Job not found' });
    if (!job.content) return res.status(400).json({ ok: false, error: 'Content not ready' });
    if (job.attempt >= job.maxAttempts) return res.status(400).json({ ok: false, error: 'Max attempts reached' });

    jobStore.update(job.id, { attempt: job.attempt + 1, status: 'running', stage: 'generating_images', message: 'Retrying images…', percent: Math.min(95, job.percent || 70), warning: null, error: null });
    jobStore.emit(job.id, { stage: 'running', message: `Retrying images (attempt ${job.attempt + 1}/${job.maxAttempts})…`, percent: Math.min(95, job.percent || 70) });

    const imageApiKey = process.env.IMAGE_API_KEY || process.env.GOOGLE_API_KEY;
    const effectiveProvider = getEffectiveProvider({ imageApiKey });
    const seed = Number(job.seed || 1000);

    const imageResult = await generateImagesForContent({
        payload: job.payload,
        content: job.content,
        seed,
        provider: effectiveProvider,
        apiKey: imageApiKey,
        generateImageDataUri,
        quotaState: imageQuotaState,
        retry: { maxAttempts: 3, baseDelayMs: 1000 },
        onProgress: (p) => {
            const base = 70;
            const span = 25;
            const percent = base + Math.round(span * (p.done / Math.max(1, p.total)));
            jobStore.update(job.id, { percent, message: p.message, stage: 'generating_images' });
            jobStore.emit(job.id, { stage: 'running', message: p.message, percent, meta: p.meta });
        }
    });

    jobStore.update(job.id, { generatedImages: imageResult.generatedImages, imageGeneration: imageResult.imageGeneration });
    jobStore.update(job.id, { status: 'completed', stage: 'completed', message: 'Completed', percent: 100 });
    jobStore.emit(job.id, { stage: 'completed', message: 'Completed', percent: 100 });

    res.json({ ok: true });
});

app.post('/api/download/:type', (req, res) => {
    const { type } = req.params;
    const normalized = normalizeDownloadPayload(req.body);
    if (!normalized.ok) {
        return res.status(400).json({ error: normalized.errors.join(' ') });
    }
    const data = sanitizeDownloadPayload(normalized.value);
    console.log(`[DOWNLOAD] ${type.toUpperCase()} Request:`, JSON.stringify({
        topic: data.topic,
        length: data.length,
        includeImages: data.includeImages,
        imageCount: data.imageCount
    }, null, 2));

    // Add ID for temp file
    data.id = Date.now().toString();

    const scriptName = type === 'pdf' ? 'generate_pdf.py' : 'generate_docx.py';
    const scriptPath = path.join(__dirname, 'python_services', scriptName);

    const pythonProcess = spawn('python', [scriptPath], {
        cwd: __dirname,
        env: {
            ...process.env,
            PYTHONIOENCODING: 'utf-8'
        }
    });

    let outputData = '';
    let errorData = '';

    // Write data to stdin of python script
    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (chunk) => {
        outputData += chunk.toString();
    });

    pythonProcess.stderr.on('data', (chunk) => {
        errorData += chunk.toString();
    });

    pythonProcess.on('error', (err) => {
        console.error('Python spawn error:', err?.message || err);
        return res.status(500).json({ error: 'Export worker failed to start' });
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Python script error: ${errorData}`);
            return res.status(500).json({ error: 'Generation failed' });
        }

        const filename = outputData.trim();
        const filePath = path.join(__dirname, filename); // Script outputs filename in current dir (server/)

        if (fs.existsSync(filePath)) {
            res.download(filePath, (err) => {
                if (err) console.error('Download error:', err);
                // Clean up file after download
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) console.error('File cleanup error:', unlinkErr);
                });
            });
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
