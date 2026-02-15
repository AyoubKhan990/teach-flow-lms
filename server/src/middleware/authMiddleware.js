// server/src/middleware/authMiddleware.js

// Middleware to protect private routes
export const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    if (req.user?.settings?.account?.status === "deactivated") {
      return res.status(403).json({ success: false, message: "Account deactivated" });
    }
    return next();
  }
  res.status(401).json({ success: false, message: "Unauthorized" });
};
