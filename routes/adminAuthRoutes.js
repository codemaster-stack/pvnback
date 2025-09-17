const express = require("express");
const router = express.Router(); // <-- THIS MUST BE FIRST
const { protectAdmin } = require("../middleware/adminMiddleware");



router.get("/dashboard", protectAdmin, (req, res) => {
  res.json({ message: `Welcome Admin ${req.admin.username}` });
});


const {
  registerAdmin,
  loginAdmin,
  forgotPassword,
  resetPassword,
} = require("../controllers/adminAuthController");

// Public routes
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/forgot", forgotPassword);
router.post("/reset", resetPassword);


module.exports = router;


