// controllers/adminAuthController.js
const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// @desc    Register new admin
exports.registerAdmin = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = await Admin.create({ username, email, password });
    res.status(201).json({
      _id: admin._id,
      username: admin.username,
      email: admin.email,
      token: generateToken(admin._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login admin
exports.loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (admin && (await admin.matchPassword(password))) {
      res.json({
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    next(error);
  }
};


// @desc    Forgot password (send reset email)
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Create a plain reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token before saving to DB
    admin.resetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    admin.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await admin.save();

    // Create reset URL (frontend link)
    const resetUrl = `${process.env.FRONTEND_URL}/admindashboard.html?resetToken=${resetToken}`;

    // Send email
    await sendEmail({
      email: admin.email,
      subject: "PVNBank Admin Password Reset",
      message: `You requested a password reset. Click here to reset your password:\n\n${resetUrl}\n\nThis link will expire in 15 minutes.`,
    });

    res.json({ message: "Reset link sent to your email" });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
exports.resetPassword = async (req, res, next) => { 
  try {
    const { token, password } = req.body; // <-- adjust key here

    // Hash incoming token to match DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find admin with matching token and not expired
    const admin = await Admin.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Update password (pre-save hook hashes it)
    admin.password = password;
    admin.resetToken = undefined;
    admin.resetTokenExpiry = undefined;
    await admin.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};
