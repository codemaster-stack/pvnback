const express = require("express");
const multer = require("multer");
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
const fs = require("fs");
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
router.use(protect); // all routes below require authentication

router.post("/create-card", createCreditCard);
router.get("/dashboard", getDashboard);
router.get("/transactions", getTransactions);
router.get("/users/has-pin", hasPin);
router.post("/users/create-pin", createPin);
router.post("/forgot-pin", forgotPin);
router.post("/reset-pin", resetPin);

// User info & profile picture
router.get("/me", getMe);
router.put("/profile-picture", upload.single("profilePic"), updateProfilePicture);

module.exports = router;
