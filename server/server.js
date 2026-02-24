// server/server.js
import path from "path";
import { fileURLToPath } from "url";
import MongoStore from "connect-mongo";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import cors from "cors";
import session from "express-session";

import connectDB from "./src/utils/connectDB.js";
import authRoutes from "./src/routes/auth.js";
import "./src/config/passport.js"; // Passport config

import playlistRoutes from "./src/routes/playlist.js";
import feedRoutes from "./src/routes/feed.js";

import videosRouter from "./src/routes/playerControl/transcript.js";
import aiRoutes from "./src/routes/aiRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import assignmentWriterRoutes from "./src/routes/assignmentWriter.js";
import resumesRoutes from "./src/routes/resumes.js";

const app = express();

const isDev = process.env.NODE_ENV !== "production";
const hasMongo = Boolean(process.env.MONGO_URI);
const skipDb = process.env.SKIP_DB === "true";

const serverUrl =
  process.env.SERVER_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  `http://localhost:${process.env.PORT || 8000}`;
const clientUrl = process.env.CLIENT_URL || serverUrl;

const isCrossSite = (() => {
  if (isDev) return false;
  try {
    return new URL(clientUrl).origin !== new URL(serverUrl).origin;
  } catch {
    return false;
  }
})();

let dbConnectedAt = null;

async function initDatabase() {
  if (hasMongo && !skipDb) {
    await connectDB();
    dbConnectedAt = new Date().toISOString();
    return;
  }

  if (isDev || skipDb) {
    console.warn(
      "⚠️ MONGO_URI missing or SKIP_DB set: starting server without database"
    );
    return;
  }

  throw new Error("MONGO_URI is required in production");
}

// Middleware
if (isDev) {
  const allowlist = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
  ]);

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowlist.has(origin)) return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );
}

app.use(express.json({ limit: "50mb" }));

app.set("trust proxy", 1);
// Session setup
if (!process.env.SESSION_SECRET && !isDev) {
  throw new Error("SESSION_SECRET is required in production");
}

const mongoUrl = process.env.MONGO_URI;
const forceIpv4 = process.env.MONGO_FORCE_IPV4 === "true";
const isLocalMongo =
  typeof mongoUrl === "string" && /mongodb:\/\/(localhost|127\.0\.0\.1)/i.test(mongoUrl);
app.use(
  session({
    name: "connect.sid", // Explicitly set cookie name
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    proxy: true, // Required for secure cookies behind a proxy (like Render/Netlify)
    ...(hasMongo
      ? {
          store: MongoStore.create({
            mongoUrl,
            mongoOptions: isLocalMongo || forceIpv4 ? { family: 4 } : undefined,
            collectionName: "sessions",
          }),
        }
      : {}),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ⬅️ IMPORTANT: required for cross-site cookies
      sameSite: isCrossSite ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      domain: process.env.NODE_ENV === "production" ? undefined : undefined, // Let browser infer domain unless we have a custom domain
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    nodeEnv: process.env.NODE_ENV,
    uptimeSec: Math.round(process.uptime()),
    db: {
      hasMongo: Boolean(process.env.MONGO_URI),
      skipDb: process.env.SKIP_DB === "true",
      readyState: mongoose.connection.readyState,
      connectedAt: dbConnectedAt,
    },
  });
});

// Root route handled below in production


// PlAYLIST routes

app.use("/api/playlists", playlistRoutes);

// Feed route
app.use("/api/feed", feedRoutes);

// Player Contorls
app.use("/api/videos", videosRouter);
app.use("/api/ai", aiRoutes);
app.use("/api/user", userRoutes);
app.use("/api/resumes", resumesRoutes);
app.use("/api/assignment-writer", assignmentWriterRoutes);

// Optional protected test route
app.get("/private", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ success: true, message: "This is a protected route" });
  } else {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(frontendPath));

  app.get(/.*/, (req, res) => {
    // API routes should already be handled above, so this catches everything else for SPA routing
    res.sendFile(path.join(frontendPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("🚀 TeachFlow LMS server is running... (Dev Mode)");
  });
}

// Start server
const PORT = process.env.PORT || 8000;

async function start() {
  await initDatabase();
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

start().catch((err) => {
  console.error("❌ Server failed to start", err?.message || err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled promise rejection", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught exception", err);
  process.exit(1);
});
