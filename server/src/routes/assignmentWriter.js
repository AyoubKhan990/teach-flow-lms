import express from "express";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);

const projectRoot = path.resolve(__dirname, "../../..");
const assignmentWriterServerDir = path.join(
  projectRoot,
  "Assignment-writer",
  "ai-assignment-writer",
  "server"
);

const { normalizeGeneratePayload, normalizeDownloadPayload, generateContent } = require(
  path.join(assignmentWriterServerDir, "generator.js")
);
const { JobStore, runJob } = require(path.join(assignmentWriterServerDir, "jobs.js"));
const { FeedbackStore } = require(path.join(assignmentWriterServerDir, "feedbackStore.js"));

const router = express.Router();

const jobStore = new JobStore({ ttlMs: 24 * 60 * 60 * 1000, maxEvents: 300 });
const feedbackStore = new FeedbackStore({ maxEntries: 500 });

const stripSurrogates = (value) => {
  if (typeof value !== "string") return value;
  return value.replace(/[\uD800-\uDFFF]/g, "");
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
  return cleaned;
};

router.post("/feedback", (req, res) => {
  const jobId = typeof req.body?.jobId === "string" ? req.body.jobId.trim() : "";
  const rating = Number(req.body?.rating);
  const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : "";
  const tags = Array.isArray(req.body?.tags)
    ? req.body.tags
        .filter((t) => typeof t === "string" && t.length <= 32)
        .slice(0, 10)
    : [];
  if (!jobId) return res.status(400).json({ ok: false, error: "jobId is required" });
  if (!Number.isFinite(rating) || rating < 1 || rating > 5)
    return res.status(400).json({ ok: false, error: "rating must be 1..5" });

  feedbackStore.add({ jobId, rating, notes, tags });
  res.json({ ok: true });
});

router.get("/monitoring/feedback", (req, res) => {
  const limit = Number(req.query?.limit || 50);
  res.json({ ok: true, items: feedbackStore.recent(limit) });
});

router.post("/jobs", async (req, res) => {
  const normalized = normalizeGeneratePayload(req.body);
  if (!normalized.ok) return res.status(400).json({ ok: false, errors: normalized.errors });

  const { includeImages, imageCount, images, ...payload } = normalized.value;
  const job = jobStore.create({ payload });
  const seed = Math.floor(Math.random() * 100000) + 1;
  jobStore.update(job.id, { seed });
  jobStore.emit(job.id, { stage: "queued", message: "Job created", percent: 0 });

  runJob({
    jobId: job.id,
    store: jobStore,
    generateContent,
    seed,
  });

  res.json({ ok: true, job: { id: job.id } });
});

router.get("/jobs/:jobId", (req, res) => {
  const job = jobStore.get(req.params.jobId);
  if (!job) return res.status(404).json({ ok: false, error: "Job not found" });

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
    lastEventSeq: job.seq,
  };

  const result =
    job.status === "completed"
      ? {
          ...job.payload,
          seed: job.seed,
          content: job.content || "",
        }
      : null;

  res.json({ ok: true, job: snapshot, result });
});

router.get("/jobs/:jobId/events", (req, res) => {
  const jobId = req.params.jobId;
  const job = jobStore.get(jobId);
  if (!job) return res.status(404).end();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
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
    lastEventSeq: job.seq,
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

  req.on("close", () => {
    clearInterval(heartbeat);
    jobStore.removeSseClient(jobId, res);
    try {
      res.end();
    } catch {
    }
  });
});

router.post("/jobs/:jobId/cancel", (req, res) => {
  const job = jobStore.get(req.params.jobId);
  if (!job) return res.status(404).json({ ok: false, error: "Job not found" });
  if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
    return res.json({ ok: true, job: { id: job.id, status: job.status } });
  }
  jobStore.update(job.id, { cancelled: true, status: "cancelled", stage: "cancelled", message: "Cancelled" });
  jobStore.emit(job.id, { stage: "cancelled", message: "Cancelled", percent: job.percent || 0 });
  res.json({ ok: true, job: { id: job.id, status: "cancelled" } });
});

router.post("/download/:type", (req, res) => {
  const { type } = req.params;
  const normalized = normalizeDownloadPayload(req.body);
  if (!normalized.ok) return res.status(400).json({ error: normalized.errors.join(" ") });
  const data = sanitizeDownloadPayload(normalized.value);
  if (typeof data.content === "string") {
    data.content = data.content.replace(/\[IMAGE:[^\]]*\]/g, "").replace(/\n{3,}/g, "\n\n").trim();
  }
  delete data.includeImages;
  delete data.imageCount;
  delete data.images;

  data.id = Date.now().toString();

  const scriptName = type === "pdf" ? "generate_pdf.py" : "generate_docx.py";
  const scriptPath = path.join(assignmentWriterServerDir, "python_services", scriptName);

  const pythonProcess = spawn("python", [scriptPath], {
    cwd: assignmentWriterServerDir,
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
    },
  });

  let outputData = "";
  let errorData = "";

  pythonProcess.stdin.write(JSON.stringify(data));
  pythonProcess.stdin.end();

  pythonProcess.stdout.on("data", (chunk) => {
    outputData += chunk.toString();
  });

  pythonProcess.stderr.on("data", (chunk) => {
    errorData += chunk.toString();
  });

  pythonProcess.on("error", () => {
    return res.status(500).json({ error: "Export worker failed to start" });
  });

  pythonProcess.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: "Generation failed" });
    }

    const filename = path.basename(String(outputData || "").trim());
    const ext = type === "pdf" ? ".pdf" : ".docx";
    if (!filename.endsWith(ext)) return res.status(500).json({ error: "Invalid output file" });

    const filePath = path.join(assignmentWriterServerDir, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });

    res.download(filePath, (err) => {
      if (!err) {
        fs.unlink(filePath, () => {
        });
      }
    });
  });
});

export default router;

