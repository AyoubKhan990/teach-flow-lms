// server/server.js
import path from "path";
import { fileURLToPath } from "url";
import MongoStore from "connect-mongo";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from "dotenv";
dotenv.config();

import express from "express";
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

// ✅ Connect to MongoDB (optional in dev or if skipped)
if (hasMongo && !skipDb) {
  connectDB();
} else if (isDev || skipDb) {
  console.warn("⚠️ MONGO_URI missing or SKIP_DB set: starting server without database");
} else {
  throw new Error("MONGO_URI is required in production");
}

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));

app.set("trust proxy", 1);
// Session setup
if (!process.env.SESSION_SECRET && !isDev) {
  throw new Error("SESSION_SECRET is required in production");
}
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
            mongoUrl: process.env.MONGO_URI,
            collectionName: "sessions",
          }),
        }
      : {}),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ⬅️ IMPORTANT: required for cross-site cookies
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      domain: process.env.NODE_ENV === "production" ? undefined : undefined, // Let browser infer domain unless we have a custom domain
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", authRoutes);

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
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
