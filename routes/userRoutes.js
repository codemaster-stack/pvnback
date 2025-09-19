const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const upload = require("../config/multerConfig");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  createCreditCard,
  getDashboard,
  getTransactions,
  uploadProfilePicture,
  createPin,
  hasPin,
  forgotPin,
  resetPin
} = require("../controllers/userController");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot", forgotPassword);
router.post("/reset", resetPassword);
router.post("/create-card", protect, createCreditCard);
router.get("/dashboard", protect, getDashboard);
router.get("/transactions", protect, getTransactions);
router.post("/upload-photo", protect, upload.single("photo"), uploadProfilePicture);
router.get("/users/has-pin", protect, hasPin);
router.post("/users/create-pin", protect, createPin);
router.post("/forgot-pin", protect, forgotPin);
router.post("/reset-pin", resetPin);




module.exports = router;
