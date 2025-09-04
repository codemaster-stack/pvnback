// routes/auth.js
const express = require("express");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  registerAdmin,
  loginAdmin, 
  forgotAdminPassword, 
  resetAdminPassword,
  logout
} = require("../controllers/authController");

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post('/api/auth/logout', logout);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.post("/admin/register", registerAdmin);
router.post("/admin/login", loginAdmin);
router.post("/admin/forgot-password", forgotAdminPassword);
router.put("/admin/reset-password/:token", resetAdminPassword);

module.exports = router;
