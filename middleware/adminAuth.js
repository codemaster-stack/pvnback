// middleware/adminAuth.js
const adminAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  // FIX: Check role from database user object, not JWT payload
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};

module.exports = adminAuth;