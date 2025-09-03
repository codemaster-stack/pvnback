// routes/auth.js
const express = require("express");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  registerAdmin,
} = require("../controllers/authController");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.post("/admin/register", registerAdmin);

module.exports = router;
