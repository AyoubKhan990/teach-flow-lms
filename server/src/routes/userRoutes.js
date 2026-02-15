import express from "express";
import User from "../models/User.js";
import Playlist from "../models/playlist.js";
import Resume from "../models/Resume.js";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import mongoose from "mongoose";
import crypto from "crypto";

const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    if (req.user?.settings?.account?.status === "deactivated") {
      return res.status(403).json({ error: "Account deactivated" });
    }
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

function countWords(text) {
  const s = typeof text === "string" ? text.trim() : "";
  if (!s) return 0;
  return s.split(/\s+/).filter(Boolean).length;
}

function isValidHttpUrl(value) {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// GET /api/user/dashboard - Get all user data for dashboard
router.get("/dashboard", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Initialize fields if missing
    if (!user.stats)
      user.stats = {
        totalWatchTime: 0,
        totalQuizzesSolved: 0,
        topicsCleared: [],
      };
    if (!user.dailyActivity) user.dailyActivity = [];
    if (!user.quizHistory) user.quizHistory = [];

    // Calculate Streak
    let streak = 0;
    const sortedActivity = user.dailyActivity.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    // Check if active today or yesterday to start streak
    let currentCheck = new Date();
    if (sortedActivity.length > 0) {
      const lastActive = sortedActivity[0].date;
      if (lastActive === today || lastActive === yesterday) {
        streak = 1;
        // Simple logic: iterate backwards checking for consecutive days
        for (let i = 1; i < sortedActivity.length; i++) {
          const prevDate = new Date(sortedActivity[i - 1].date);
          const currDate = new Date(sortedActivity[i].date);
          const diffTime = Math.abs(prevDate - currDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    res.json({
      stats: user.stats,
      dailyActivity: user.dailyActivity,
      quizHistory: user.quizHistory,
      streak,
      user: {
        name: user.name,
        email: user.email,
        picture: user.picture,
        lastLogin: user.lastLogin,
        accountType: user.accountType,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        accountType: user.accountType,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
      profile: user.profile || {},
      settings: user.settings || {},
      security: {
        hasPassword: Boolean(user.security?.passwordHash),
        twoFactorEnabled: Boolean(user.security?.twoFactor?.enabled),
      },
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/user/profile - Update user profile
router.put("/profile", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const updates = {};

    if (typeof req.body?.name === "string") {
      const name = req.body.name.trim();
      if (!name) return res.status(400).json({ error: "Name is required" });
      updates.name = name;
    }

    if (typeof req.body?.accountType === "string") updates.accountType = req.body.accountType;

    const profilePatch = {};
    if (typeof req.body?.phone === "string") profilePatch["profile.phone"] = req.body.phone.trim();
    if (typeof req.body?.location === "string")
      profilePatch["profile.location"] = req.body.location.trim();
    if (typeof req.body?.professionalTitle === "string")
      profilePatch["profile.professionalTitle"] = req.body.professionalTitle.trim();
    if (typeof req.body?.summaryMd === "string") {
      const words = countWords(req.body.summaryMd);
      if (words > 500) return res.status(400).json({ error: "Summary exceeds 500 words" });
      profilePatch["profile.summaryMd"] = req.body.summaryMd;
    }

    const socials = req.body?.socials && typeof req.body.socials === "object" ? req.body.socials : null;
    if (socials) {
      const candidates = ["linkedin", "github", "twitter", "website"];
      for (const k of candidates) {
        if (typeof socials[k] === "string") {
          const v = socials[k].trim();
          if (!isValidHttpUrl(v)) return res.status(400).json({ error: `Invalid URL for ${k}` });
          profilePatch[`profile.socials.${k}`] = v;
        }
      }
    }

    if (typeof req.body?.visibility === "string") {
      if (req.body.visibility !== "public" && req.body.visibility !== "private") {
        return res.status(400).json({ error: "Invalid visibility value" });
      }
      profilePatch["profile.visibility"] = req.body.visibility;
    }

    if (typeof req.body?.picture === "string") {
      const pic = req.body.picture.trim();
      if (pic && pic.length > 8_000_000) return res.status(400).json({ error: "Picture too large" });
      updates.picture = pic;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { ...updates, ...profilePatch } },
      { new: true }
    ).lean();

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/settings", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select("settings security").lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      success: true,
      settings: user.settings || {},
      security: {
        hasPassword: Boolean(user.security?.passwordHash),
        twoFactorEnabled: Boolean(user.security?.twoFactor?.enabled),
      },
    });
  } catch (error) {
    console.error("Get Settings Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/settings", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const patch = {};

    if (typeof req.body?.theme === "string") {
      if (!["light", "dark", "auto"].includes(req.body.theme)) {
        return res.status(400).json({ error: "Invalid theme" });
      }
      patch["settings.theme"] = req.body.theme;
    }
    if (typeof req.body?.language === "string") {
      const lang = req.body.language.trim();
      if (!lang) return res.status(400).json({ error: "Invalid language" });
      patch["settings.language"] = lang;
    }

    if (req.body?.notifications && typeof req.body.notifications === "object") {
      const n = req.body.notifications;
      if (typeof n.email === "boolean") patch["settings.notifications.email"] = n.email;
      if (typeof n.push === "boolean") patch["settings.notifications.push"] = n.push;
      if (typeof n.inApp === "boolean") patch["settings.notifications.inApp"] = n.inApp;
    }

    if (req.body?.privacy && typeof req.body.privacy === "object") {
      const p = req.body.privacy;
      if (typeof p.dataSharing === "boolean") patch["settings.privacy.dataSharing"] = p.dataSharing;
      if (typeof p.gdpr === "boolean") patch["settings.privacy.gdpr"] = p.gdpr;
    }

    if (req.body?.tutorials && typeof req.body.tutorials === "object") {
      const t = req.body.tutorials;
      if (typeof t.cvMaker === "boolean") patch["settings.tutorials.cvMaker"] = t.cvMaker;
    }

    const user = await User.findByIdAndUpdate(userId, { $set: patch }, { new: true }).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, settings: user.settings || {} });
  } catch (error) {
    console.error("Update Settings Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/security/password/set", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.security?.passwordHash) return res.status(400).json({ error: "Password already set" });

    const hash = await bcrypt.hash(password, 12);
    user.security.passwordHash = hash;
    user.security.passwordUpdatedAt = new Date();
    await user.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Set Password Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/security/password/change", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";
    if (newPassword.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.security?.passwordHash) return res.status(400).json({ error: "No password set for this account" });

    const ok = await bcrypt.compare(currentPassword, user.security.passwordHash);
    if (!ok) return res.status(400).json({ error: "Current password is incorrect" });

    user.security.passwordHash = await bcrypt.hash(newPassword, 12);
    user.security.passwordUpdatedAt = new Date();
    await user.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/security/2fa/setup", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const secret = speakeasy.generateSecret({
      length: 20,
      name: `TeachFlow (${user.email})`,
    });

    user.security.twoFactor.tempSecret = secret.base32;
    await user.save();

    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ success: true, otpauthUrl: secret.otpauth_url, qrDataUrl });
  } catch (error) {
    console.error("2FA Setup Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/security/2fa/verify", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    if (!token) return res.status(400).json({ error: "Token is required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const temp = user.security?.twoFactor?.tempSecret;
    if (!temp) return res.status(400).json({ error: "2FA setup not initialized" });

    const ok = speakeasy.totp.verify({ secret: temp, encoding: "base32", token, window: 1 });
    if (!ok) return res.status(400).json({ error: "Invalid token" });

    const codes = Array.from({ length: 8 }).map(() =>
      crypto.randomBytes(6).toString("hex")
    );
    const hashed = await Promise.all(codes.map((c) => bcrypt.hash(c, 10)));

    user.security.twoFactor.enabled = true;
    user.security.twoFactor.secret = temp;
    user.security.twoFactor.tempSecret = "";
    user.security.twoFactor.recoveryCodes = hashed;
    await user.save();

    res.json({ success: true, recoveryCodes: codes });
  } catch (error) {
    console.error("2FA Verify Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/security/2fa/disable", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    const recoveryCode = typeof req.body?.recoveryCode === "string" ? req.body.recoveryCode.trim() : "";

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.security?.twoFactor?.enabled || !user.security?.twoFactor?.secret) {
      return res.status(400).json({ error: "2FA is not enabled" });
    }

    let ok = false;
    if (token) {
      ok = speakeasy.totp.verify({
        secret: user.security.twoFactor.secret,
        encoding: "base32",
        token,
        window: 1,
      });
    } else if (recoveryCode) {
      const hashes = Array.isArray(user.security.twoFactor.recoveryCodes)
        ? user.security.twoFactor.recoveryCodes
        : [];
      for (let i = 0; i < hashes.length; i++) {
        if (await bcrypt.compare(recoveryCode, hashes[i])) {
          hashes.splice(i, 1);
          user.security.twoFactor.recoveryCodes = hashes;
          ok = true;
          break;
        }
      }
    }

    if (!ok) return res.status(400).json({ error: "Invalid token or recovery code" });

    user.security.twoFactor.enabled = false;
    user.security.twoFactor.secret = "";
    user.security.twoFactor.tempSecret = "";
    user.security.twoFactor.recoveryCodes = [];
    await user.save();

    res.json({ success: true });
  } catch (error) {
    console.error("2FA Disable Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/sessions", isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.user._id || req.user.id);
    const conn = mongoose.connection;
    const hasDb = conn && conn.readyState === 1;
    if (!hasDb) return res.json({ success: true, sessions: [] });

    const col = conn.collection("sessions");
    const docs = await col.find({}).limit(5000).toArray();

    const sessions = docs
      .map((d) => {
        const raw = d.session;
        const s =
          typeof raw === "string"
            ? (() => {
                try {
                  return JSON.parse(raw);
                } catch {
                  return null;
                }
              })()
            : raw;
        return { doc: d, session: s };
      })
      .filter((x) => x.session && String(x.session?.passport?.user || "") === userId)
      .map((x) => ({
        sid: x.doc._id,
        expires: x.doc.expires || null,
      }));

    res.json({ success: true, sessions });
  } catch (error) {
    console.error("Sessions Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/sessions/:sid", isAuthenticated, async (req, res) => {
  try {
    const conn = mongoose.connection;
    const hasDb = conn && conn.readyState === 1;
    if (!hasDb) return res.json({ success: true });
    await conn.collection("sessions").deleteOne({ _id: req.params.sid });
    res.json({ success: true });
  } catch (error) {
    console.error("Revoke Session Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/account/deactivate", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "settings.account.status": "deactivated",
          "settings.account.deactivatedAt": new Date(),
        },
      },
      { new: true }
    ).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, settings: user.settings || {} });
  } catch (error) {
    console.error("Deactivate Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/account/reactivate", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "settings.account.status": "active",
          "settings.account.deactivatedAt": null,
        },
      },
      { new: true }
    ).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, settings: user.settings || {} });
  } catch (error) {
    console.error("Reactivate Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/account", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    await Promise.all([
      Playlist.deleteMany({ user: userId }),
      Resume.deleteMany({ user: userId }),
      User.deleteOne({ _id: userId }),
    ]);
    req.logout(() => {
      if (req.session) req.session.destroy(() => {});
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Delete Account Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/export", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const format = typeof req.query.format === "string" ? req.query.format : "json";

    const [user, playlists, resumes] = await Promise.all([
      User.findById(userId).lean(),
      Playlist.find({ user: userId }).lean(),
      Resume.find({ user: userId }).lean(),
    ]);
    if (!user) return res.status(404).json({ error: "User not found" });

    const payload = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        accountType: user.accountType,
        profile: user.profile || {},
        settings: user.settings || {},
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
      playlists,
      resumes,
    };

    if (format === "xml") {
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<data>${escapeXml(
        JSON.stringify(payload)
      )}</data>`;
      return res.send(xml);
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// POST /api/user/quiz-result - Save quiz result
router.post("/quiz-result", isAuthenticated, async (req, res) => {
  try {
    const { videoId, videoTitle, score, totalQuestions, difficulty, topics } =
      req.body;
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Add to history
    user.quizHistory.push({
      date: new Date(),
      videoId,
      videoTitle,
      score,
      totalQuestions,
      difficulty,
    });

    // Update stats
    if (!user.stats) {
      user.stats = {
        totalWatchTime: 0,
        totalQuizzesSolved: 0,
        topicsCleared: [],
      };
    }
    user.stats.totalQuizzesSolved += 1;

    // Update topics
    if (topics && Array.isArray(topics)) {
      topics.forEach((topic) => {
        if (!user.stats.topicsCleared.includes(topic)) {
          user.stats.topicsCleared.push(topic);
        }
      });
    }

    await user.save();

    res.json({ success: true, quizHistory: user.quizHistory });
  } catch (error) {
    console.error("Save Quiz Result Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/user/track - Track user activity (watch time, app open time)
router.post("/track", isAuthenticated, async (req, res) => {
  try {
    const { videoId, watchTime, appOpenTime, title, thumbnailUrl, playlistId } =
      req.body;
    const userId = req.user._id || req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const today = new Date().toISOString().split("T")[0];
    let todayActivity = user.dailyActivity.find((a) => a.date === today);

    if (!todayActivity) {
      todayActivity = {
        date: today,
        watchTime: 0,
        appOpenTime: 0,
        videosWatched: [],
        loginCount: 1,
      };
      user.dailyActivity.push(todayActivity);
      todayActivity = user.dailyActivity[user.dailyActivity.length - 1];
    }

    // Update Watch Time
    if (watchTime && typeof watchTime === "number") {
      user.stats.totalWatchTime = (user.stats.totalWatchTime || 0) + watchTime;
      todayActivity.watchTime = (todayActivity.watchTime || 0) + watchTime;
    }

    // Update App Open Time
    if (appOpenTime && typeof appOpenTime === "number") {
      todayActivity.appOpenTime =
        (todayActivity.appOpenTime || 0) + appOpenTime;
    }

    // Track Video & Learning Progress
    if (videoId) {
      if (!todayActivity.videosWatched.includes(videoId)) {
        todayActivity.videosWatched.push(videoId);
      }

      // Update Learning Progress (Continue Watching)
      if (title) {
        // Remove existing entry for this video
        if (!user.learningProgress) user.learningProgress = [];
        user.learningProgress = user.learningProgress.filter(
          (p) => p.videoId !== videoId
        );

        // Add new entry to top
        user.learningProgress.unshift({
          videoId,
          title,
          thumbnailUrl,
          playlistId,
          lastWatched: new Date(),
        });

        // Keep only last 20
        if (user.learningProgress.length > 20) {
          user.learningProgress = user.learningProgress.slice(0, 20);
        }
      }
    }

    await user.save();
    res.json({ success: true });
  } catch (error) {
    console.error("Tracking Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/user/learning-history - Get data for My Learning page
router.get("/learning-history", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // 1. Continue Watching
    const continueWatching = user.learningProgress || [];

    // 2. Smart Review (Low score quizzes)
    // Filter for quizzes with score < 60%
    const lowScoreQuizzes = (user.quizHistory || [])
      .filter((q) => q.totalQuestions > 0 && q.score / q.totalQuestions < 0.6)
      .sort((a, b) => new Date(b.date) - new Date(a.date)) // Most recent first
      .slice(0, 10); // Limit to 10

    // Map to a cleaner format
    const smartReview = lowScoreQuizzes.map((q) => ({
      videoId: q.videoId,
      title: q.videoTitle || "Unknown Video",
      score: q.score,
      totalQuestions: q.totalQuestions,
      date: q.date,
    }));

    res.json({
      continueWatching,
      smartReview,
    });
  } catch (error) {
    console.error("Learning History Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
