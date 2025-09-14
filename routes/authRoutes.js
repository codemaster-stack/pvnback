// // routes/auth.js
// const express = require("express");
// const {
//   register,
//   login,
//   forgotPassword,
//   resetPassword,
//   registerAdmin,
//   loginAdmin, 
//   forgotAdminPassword, 
//   resetAdminPassword,
// } = require("../controllers/authController");
// const { logout } = require("../controllers/userController");

// const router = express.Router();

// // Public routes
// router.post("/register", register);
// router.post("/login", login);
// router.post("/forgot-password", forgotPassword);
// router.put("/reset-password/:token", resetPassword);
// router.post("/admin/register", registerAdmin);
// router.post("/admin/login", loginAdmin);
// router.post("/admin/forgot-password", forgotAdminPassword);
// router.put("/admin/reset-password/:token", resetAdminPassword);
// router.post('/api/auth/logout', logout);

// module.exports = router;


// routes/authRoutes.js
// routes/authRoutes.js
const express = require("express");
const {
  register,
  login,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

module.exports = router;

