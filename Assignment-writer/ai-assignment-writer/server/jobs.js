const { randomUUID } = require('crypto');
const { validateContentAgainstParams, hashText } = require('./contentQuality');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const jitterMs = (base) => Math.max(0, Math.round(base + Math.random() * Math.min(250, base)));

const createJob = ({ payload }) => {
  const now = Date.now();
  return {
    id: randomUUID(),
    status: 'queued',
    stage: 'queued',
    message: 'Queued',
    percent: 0,
    attempt: 1,
    maxAttempts: 3,
    payload,
    content: null,
    generatedImages: [],
    imageGeneration: null,
    error: null,
    createdAt: now,
    updatedAt: now,
    events: [],
    seq: 0,
    cancelled: false
  };
};

class JobStore {
  constructor({ ttlMs = 24 * 60 * 60 * 1000, maxEvents = 200 } = {}) {
    this.ttlMs = ttlMs;
    this.maxEvents = maxEvents;
    this.jobs = new Map();
    this.sseClients = new Map();
  }

  create({ payload }) {
    const job = createJob({ payload });
    this.jobs.set(job.id, job);
    return job;
  }

  get(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    if (Date.now() - job.updatedAt > this.ttlMs) {
      this.cleanup(jobId);
      return null;
    }
    return job;
  }

  update(jobId, patch) {
    const job = this.get(jobId);
    if (!job) return null;
    Object.assign(job, patch);
    job.updatedAt = Date.now();
    return job;
  }

  emit(jobId, evt) {
    const job = this.get(jobId);
    if (!job) return;
    job.seq += 1;
    const event = {
      id: `${job.id}:${job.seq}`,
      jobId: job.id,
      seq: job.seq,
      ts: new Date().toISOString(),
      ...evt
    };
    job.events.push(event);
    if (job.events.length > this.maxEvents) job.events.splice(0, job.events.length - this.maxEvents);

    const clients = this.sseClients.get(jobId);
    if (clients && clients.size > 0) {
      const line = `event: progress\ndata: ${JSON.stringify(event)}\n\n`;
      for (const res of clients) {
        try {
          res.write(line);
        } catch {
        }
      }
    }
  }

  addSseClient(jobId, res) {
    const set = this.sseClients.get(jobId) || new Set();
    set.add(res);
    this.sseClients.set(jobId, set);
  }

  removeSseClient(jobId, res) {
    const set = this.sseClients.get(jobId);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) this.sseClients.delete(jobId);
  }

  cleanup(jobId) {
    this.jobs.delete(jobId);
    const set = this.sseClients.get(jobId);
    if (set) {
      for (const res of set) {
        try {
          res.end();
        } catch {
        }
      }
      this.sseClients.delete(jobId);
    }
  }
}

const classifyImageFailure = (imageGeneration) => {
  const status = imageGeneration?.status;
  if (!status) return { retryable: true, code: 'IMAGE_FAILED' };
  if (status === 'quota_exceeded' || status === 'quota_blocked' || status === 'billing_required') return { retryable: false, code: 'PROVIDER_RATE_LIMIT' };
  if (status === 'missing_key' || status === 'invalid_key') return { retryable: false, code: status.toUpperCase() };
  return { retryable: true, code: 'IMAGE_FAILED' };
};

const runJob = async ({ jobId, store, generateContent, generateImagesForContent, seed, quotaState, apiKey, provider, generateImageDataUri }) => {
  const job = store.get(jobId);
  if (!job) return;

    const payloadForLog = {
      topic: job.payload?.topic,
      subject: job.payload?.subject,
      level: job.payload?.level,
      length: job.payload?.length,
      style: job.payload?.style,
      pages: job.payload?.pages,
      language: job.payload?.language,
      englishVariant: job.payload?.englishVariant,
      references: job.payload?.references,
      citationStyle: job.payload?.citationStyle,
      includeImages: job.payload?.includeImages,
      imageCount: job.payload?.imageCount
    };
    console.log(`[JOB ${jobId}] payload ${JSON.stringify(payloadForLog)}`);

  const safeUpdate = (patch, event) => {
    store.update(jobId, patch);
    if (event) store.emit(jobId, event);
  };

  safeUpdate({ status: 'running', stage: 'analyzing', message: 'Analyzing requirements…', percent: 5 }, { stage: 'running', message: 'Analyzing requirements…', percent: 5 });

  try {
    if (store.get(jobId)?.cancelled) {
      safeUpdate({ status: 'cancelled', stage: 'cancelled', message: 'Cancelled', percent: 0 }, { stage: 'cancelled', message: 'Cancelled', percent: 0 });
      return;
    }

    safeUpdate({ stage: 'generating_content', message: 'Generating content…', percent: 15 }, { stage: 'running', message: 'Generating content…', percent: 15 });
    const content = await generateContent(job.payload);

    const validation = validateContentAgainstParams({ payload: job.payload, content });
    const digest = hashText(content);
    const preview = String(content || '').slice(0, 220).replace(/\s+/g, ' ').trim();
    console.log(`[JOB ${jobId}] content digest=${digest} length=${content.length} preview="${preview}"`);

    if (!validation.ok) {
      const message = 'Generated content failed parameter validation.';
      store.update(jobId, { content });
      store.emit(jobId, { stage: 'running', message: 'Validation failed', percent: 60, meta: { issues: validation.issues } });
      safeUpdate({ status: 'failed', stage: 'failed', message, percent: Math.max(0, store.get(jobId)?.percent || 0), error: { code: 'VALIDATION_FAILED', message, issues: validation.issues } }, { stage: 'failed', message, percent: store.get(jobId)?.percent || 0, error: { code: 'VALIDATION_FAILED', message, retryable: true } });
      return;
    }
    store.update(jobId, { content });
    store.emit(jobId, { stage: 'running', message: 'Content generated', percent: 60, meta: { contentLength: content.length } });
    store.update(jobId, { percent: 60 });

    if (store.get(jobId)?.cancelled) {
      safeUpdate({ status: 'cancelled', stage: 'cancelled', message: 'Cancelled', percent: 0 }, { stage: 'cancelled', message: 'Cancelled', percent: 0 });
      return;
    }

    const requested = job.payload?.includeImages ? Number(job.payload?.imageCount || 0) : 0;
    if (!requested) {
      safeUpdate({ status: 'completed', stage: 'completed', message: 'Completed', percent: 100, generatedImages: [], imageGeneration: { status: 'skipped', attempted: false, generated: 0, errors: [] } }, { stage: 'completed', message: 'Completed', percent: 100 });
      return;
    }

    safeUpdate({ stage: 'generating_images', message: 'Creating images…', percent: 70 }, { stage: 'running', message: 'Creating images…', percent: 70 });
    const imageResult = await generateImagesForContent({
      payload: job.payload,
      content,
      seed,
      provider,
      apiKey,
      generateImageDataUri,
      quotaState,
      retry: { maxAttempts: 3, baseDelayMs: 1000 },
      onProgress: (p) => {
        const base = 70;
        const span = 25;
        const percent = base + Math.round(span * (p.done / Math.max(1, p.total)));
        store.update(jobId, { percent, message: p.message, stage: 'generating_images' });
        store.emit(jobId, { stage: 'running', message: p.message, percent, meta: p.meta });
      }
    });

    store.update(jobId, { generatedImages: imageResult.generatedImages, imageGeneration: imageResult.imageGeneration });

    const imgStatus = imageResult.imageGeneration?.status;
    const totalGenerated = Array.isArray(imageResult.generatedImages) ? imageResult.generatedImages.length : 0;
    const totalRequested = requested;
    const hasImageErrors = totalRequested > 0 && (totalGenerated < totalRequested) && (Array.isArray(imageResult.imageGeneration?.errors) ? imageResult.imageGeneration.errors.length > 0 : false);

    if (hasImageErrors && imgStatus !== 'quota_exceeded' && imgStatus !== 'quota_blocked') {
      const classified = classifyImageFailure(imageResult.imageGeneration);
      store.update(jobId, {
        warning: {
          code: classified.code,
          message: imageResult.imageGeneration?.errors?.[0]?.reason || 'Some images could not be generated.'
        }
      });
      store.emit(jobId, { stage: 'running', message: 'Some images failed. You can retry, upload images, or continue without images.', percent: 95, meta: { warning: true } });
    }

    safeUpdate({ status: 'completed', stage: 'completed', message: 'Completed', percent: 100 }, { stage: 'completed', message: 'Completed', percent: 100 });
  } catch (e) {
    const message = e?.message || 'Generation failed';
    safeUpdate({ status: 'failed', stage: 'failed', message, percent: Math.max(0, store.get(jobId)?.percent || 0), error: { code: 'SERVER_ERROR', message } }, { stage: 'failed', message, percent: store.get(jobId)?.percent || 0, error: { code: 'SERVER_ERROR', message, retryable: true } });
  }
};

module.exports = {
  JobStore,
  runJob,
  sleep,
  jitterMs
};
