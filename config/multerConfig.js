const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure the folder exists
const uploadPath = path.join(__dirname, "../uploads/profiles");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath); // save in uploads/profiles
  },
  filename: (req, file, cb) => {
    // Replace spaces to avoid broken URLs
    cb(null, Date.now() + "_" + file.originalname.replace(/\s+/g, "_"));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

module.exports = multer({ storage, fileFilter });
