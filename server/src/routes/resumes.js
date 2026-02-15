import express from "express";
import Resume from "../models/Resume.js";
import { ensureAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(ensureAuth);

function toInt(v, fallback) {
  const n = Number.parseInt(String(v || ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildListQuery(userId, q) {
  const filter = { user: userId };

  const search = typeof q.q === "string" ? q.q.trim() : "";
  if (search) {
    filter.title = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
  }

  const status = typeof q.status === "string" ? q.status : "";
  if (status === "draft" || status === "completed") filter.status = status;

  const createdFrom = parseDate(q.createdFrom);
  const createdTo = parseDate(q.createdTo);
  if (createdFrom || createdTo) {
    filter.createdAt = {};
    if (createdFrom) filter.createdAt.$gte = createdFrom;
    if (createdTo) filter.createdAt.$lte = createdTo;
  }

  const updatedFrom = parseDate(q.updatedFrom);
  const updatedTo = parseDate(q.updatedTo);
  if (updatedFrom || updatedTo) {
    filter.updatedAt = {};
    if (updatedFrom) filter.updatedAt.$gte = updatedFrom;
    if (updatedTo) filter.updatedAt.$lte = updatedTo;
  }

  return filter;
}

function buildSort(q) {
  const sortKey = typeof q.sort === "string" ? q.sort : "updatedAt";
  const order = typeof q.order === "string" ? q.order : "desc";
  const dir = order === "asc" ? 1 : -1;
  const allowed = new Set(["createdAt", "updatedAt", "title", "status"]);
  const key = allowed.has(sortKey) ? sortKey : "updatedAt";
  return { [key]: dir, _id: dir };
}

router.get("/", async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const limit = clamp(toInt(req.query.limit, 24), 1, 100);
    const page = clamp(toInt(req.query.page, 1), 1, 10_000);
    const skip = (page - 1) * limit;

    const filter = buildListQuery(userId, req.query);
    const sort = buildSort(req.query);

    const [items, total] = await Promise.all([
      Resume.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select("title templateId status createdAt updatedAt data")
        .lean(),
      Resume.countDocuments(filter),
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      hasMore: skip + items.length < total,
    });
  } catch (e) {
    console.error("Resumes list error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    const templateId =
      typeof req.body?.templateId === "string" ? req.body.templateId.trim() : "modern";
    const status =
      req.body?.status === "completed" || req.body?.status === "draft"
        ? req.body.status
        : "draft";
    const data = req.body?.data && typeof req.body.data === "object" ? req.body.data : {};

    if (!title) return res.status(400).json({ error: "Title is required" });

    const doc = await Resume.create({
      user: userId,
      title,
      templateId,
      status,
      data,
    });

    res.status(201).json(doc);
  } catch (e) {
    console.error("Resume create error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const doc = await Resume.findOne({ _id: req.params.id, user: userId }).lean();
    if (!doc) return res.status(404).json({ error: "Resume not found" });
    res.json(doc);
  } catch (e) {
    console.error("Resume get error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const updates = {};

    if (typeof req.body?.title === "string") updates.title = req.body.title.trim();
    if (typeof req.body?.templateId === "string") updates.templateId = req.body.templateId.trim();
    if (req.body?.status === "completed" || req.body?.status === "draft") updates.status = req.body.status;
    if (req.body?.data && typeof req.body.data === "object") updates.data = req.body.data;

    const doc = await Resume.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { $set: updates },
      { new: true }
    ).lean();

    if (!doc) return res.status(404).json({ error: "Resume not found" });
    res.json(doc);
  } catch (e) {
    console.error("Resume update error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const r = await Resume.deleteOne({ _id: req.params.id, user: userId });
    if (!r.deletedCount) return res.status(404).json({ error: "Resume not found" });
    res.json({ success: true });
  } catch (e) {
    console.error("Resume delete error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/duplicate", async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const doc = await Resume.findOne({ _id: req.params.id, user: userId }).lean();
    if (!doc) return res.status(404).json({ error: "Resume not found" });

    const copyTitle = typeof req.body?.title === "string" ? req.body.title.trim() : `${doc.title} (Copy)`;

    const created = await Resume.create({
      user: userId,
      title: copyTitle,
      templateId: doc.templateId,
      status: doc.status,
      data: doc.data,
    });
    res.status(201).json(created);
  } catch (e) {
    console.error("Resume duplicate error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/bulk", async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(Boolean) : [];
    const action = typeof req.body?.action === "string" ? req.body.action : "";

    if (!ids.length) return res.status(400).json({ error: "No ids provided" });
    if (action !== "delete" && action !== "duplicate") {
      return res.status(400).json({ error: "Invalid action" });
    }

    if (action === "delete") {
      const r = await Resume.deleteMany({ user: userId, _id: { $in: ids } });
      return res.json({ success: true, deleted: r.deletedCount || 0 });
    }

    const docs = await Resume.find({ user: userId, _id: { $in: ids } }).lean();
    const created = await Resume.insertMany(
      docs.map((d) => ({
        user: userId,
        title: `${d.title} (Copy)`,
        templateId: d.templateId,
        status: d.status,
        data: d.data,
      })),
      { ordered: false }
    );

    res.status(201).json({ success: true, createdCount: created.length });
  } catch (e) {
    console.error("Resume bulk error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

