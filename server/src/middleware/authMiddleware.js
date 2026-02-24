// server/src/middleware/authMiddleware.js

import { getOrCreateDevUser } from "../utils/devUser.js";

// Middleware to protect private routes
export const ensureAuth = async (req, res, next) => {
  const isDev = process.env.NODE_ENV !== "production";
  const bypass = isDev && process.env.DEV_AUTH_BYPASS === "true";

  if (bypass && !req.user) {
    req.user = await getOrCreateDevUser();
  }

  const isAuthed = bypass ? Boolean(req.user) : req.isAuthenticated();

  if (isAuthed) {
    if (req.user?.settings?.account?.status === "deactivated") {
      return res
        .status(403)
        .json({ success: false, message: "Account deactivated" });
    }
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Unauthorized",
    remediation:
      "Sign in via Google OAuth, or set DEV_AUTH_BYPASS=true for local development.",
  });
};
