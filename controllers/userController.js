const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");


const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// Generate random 10-digit account number
const generateAccountNumber = () =>
  Math.floor(1000000000 + Math.random() * 9000000000).toString();

// Ensure unique account number
const generateUniqueAccountNumber = async (field) => {
  let accountNumber;
  let exists = true;

  while (exists) {
    accountNumber = generateAccountNumber();
    const existingUser = await User.findOne({ [field]: accountNumber });
    if (!existingUser) {
      exists = false;
    }
  }
  return accountNumber;
};

// @desc Register new user
exports.register = async (req, res) => {
  try {
    const { fullname, email, phone, password } = req.body;

    if (!fullname || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const savingsAccountNumber = await generateUniqueAccountNumber("savingsAccountNumber");
    const currentAccountNumber = await generateUniqueAccountNumber("currentAccountNumber");

    const user = new User({
      fullname,
      email,
      phone,
      password,
      savingsAccountNumber,
      currentAccountNumber,
    });

    await user.save();

    res.status(201).json({
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phone: user.phone,
      savingsAccountNumber: user.savingsAccountNumber,
      currentAccountNumber: user.currentAccountNumber,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// @desc Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phone: user.phone,
      savingsAccountNumber: user.savingsAccountNumber,
      currentAccountNumber: user.currentAccountNumber,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Forgot password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create a plain reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token before saving to DB
    user.resetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Create reset URL (frontend link)
    const resetUrl = `${process.env.FRONTEND_URL}/index.html?resetToken=${resetToken}`;

    // Send email
    await sendEmail({
      email: user.email,
      subject: "PVNBank User Password Reset",
      message: `You requested a password reset. Click here to reset your password:\n\n${resetUrl}\n\nThis link will expire in 25 minutes.`,
    });

    res.json({ message: "Reset link sent to your email" });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const token = req.body.token || req.params.token || req.query.resetToken;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Reset token is missing" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};
