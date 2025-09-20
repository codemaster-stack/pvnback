const express = require("express");
const multer = require("multer");
const fs = require("fs");
const router = express.Router();
const { protect } = require("../middleware/auth");

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  createCreditCard,
  getDashboard,
  getTransactions,
  updateProfilePicture,
  createPin,
  hasPin,
  forgotPin,
  resetPin,
  getMe
} = require("../controllers/userController");

// Multer setup
const uploadPath = "./uploads/profiles";
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname)
});
const upload = multer({ storage });

// Auth routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot", forgotPassword);
router.post("/reset", resetPassword);

// Protected routes
router.use(protect);

router.post("/create-card", createCreditCard);
router.get("/dashboard", getDashboard);
router.get("/transactions", getTransactions);

// FIX: remove extra `/users` prefix
router.get("/has-pin", hasPin);
router.post("/create-pin", createPin);
router.post("/forgot-pin", forgotPin);
router.post("/reset-pin", resetPin);

// User info & profile picture
router.get("/me", getMe);
router.put("/profile-picture", upload.single("profilePic"), updateProfilePicture);

module.exports = router;
