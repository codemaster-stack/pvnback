const express = require("express");
const router = express.Router(); // <-- THIS MUST BE FIRST
const { protectAdmin } = require("../middleware/adminMiddleware");
const multer = require("multer");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profilePics/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});
const upload = multer({ storage });


router.get("/dashboard", protectAdmin, (req, res) => {
  res.json({ message: `Welcome Admin ${req.admin.username}` });
});


const {
  registerAdmin,
  loginAdmin,
  forgotPassword,
  resetPassword,
  updateUser,
  resetUserPin,
  deleteUser,
  fundUser,
  getUsers
} = require("../controllers/adminAuthController");

// Public routes
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/forgot", forgotPassword);
router.post("/reset", resetPassword);
router.get("/users", protectAdmin, getUsers);

// Update user profile (with optional profile pic)
router.put("/users/:id", protectAdmin, upload.single("photo"), updateUser);

// Reset transaction PIN
router.post("/users/:id/reset-pin", protectAdmin, resetUserPin);

// Delete user
router.delete("/users/:id", protectAdmin, deleteUser);

// Fund user
router.post("/users/:id/fund", protectAdmin, fundUser);



module.exports = router;


