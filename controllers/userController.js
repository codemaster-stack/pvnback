const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");
const CreditCard = require("../models/creditCardModel");
const Transaction = require("../models/Transaction");


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


exports.createCreditCard = async (req, res) => {
  try {
    const { cardType, cardLimit } = req.body;
    const userId = req.user.id; // comes from protect middleware

    if (!cardType || !cardLimit) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newCard = new CreditCard({
      user: userId,
      cardType,
      cardLimit,
      status: "pending" // pending admin approval
    });

    await newCard.save();

    res.status(201).json({ message: "Credit card request submitted for approval" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id; // comes from auth middleware
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch balances from transactions
    const inflow = await Transaction.aggregate([
      { $match: { userId, type: "inflow" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const outflow = await Transaction.aggregate([
      { $match: { userId, type: "outflow" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.json({
      fullname: user.fullname,
      email: user.email,
      phone: user.phone,
      savingsAccountNumber: user.savingsAccountNumber,
      currentAccountNumber: user.currentAccountNumber,
      balances: {
        savings: user.savingsBalance || 0,
        current: user.currentBalance || 0,
        loan: user.loanBalance || 0,
        inflow: inflow[0]?.total || 0,
        outflow: outflow[0]?.total || 0,
      },
      lastLoginIP: user.lastLoginIP || "N/A",
      lastLoginDate: user.lastLoginDate || "N/A",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user transactions (filter by inflow/outflow)
// @route   GET /api/users/transactions?type=inflow
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const type = req.query.type; // inflow or outflow

    const query = { userId };
    if (type) query.type = type;

    const transactions = await Transaction.find(query).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



exports.createPin = async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length !== 4) {
      return res.status(400).json({ message: "PIN must be exactly 4 digits" });
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { transactionPin: hashedPin },
      { new: true }
    );

    res.json({ message: "Transaction PIN set successfully" });
  } catch (err) {
    console.error("Error creating PIN:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// @desc    Check if user has a PIN set
// @route   GET /api/users/has-pin
// @access  Private
exports.hasPin = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("transactionPin");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ hasPin: !!user.transactionPin }); // true if pin exists, false otherwise
  } catch (err) {
    console.error("Error checking PIN:", err);
    res.status(500).json({ message: "Server error" });
  }
};



exports.verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin || pin.length !== 4) {
      return res.status(400).json({ message: "PIN must be exactly 4 digits" });
    }

    // Fetch user with pin (remember: pin is excluded by default)
    const user = await User.findById(req.user.id).select("+transactionPin");

    if (!user || !user.transactionPin) {
      return res.status(400).json({ message: "No PIN set. Please create one first." });
    }

    const isMatch = await user.matchPin(pin);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    res.json({ success: true, message: "PIN verified successfully" });
  } catch (err) {
    console.error("Error verifying PIN:", err);
    res.status(500).json({ message: "Server error" });
  }
};



exports.forgotPin = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    const resetUrl = `https://pvbonline.online/reset-pin.html?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: "Reset Your Transaction PIN",
      text: `Click the link to reset your PIN: ${resetUrl}`
    });

    res.json({ message: "Reset instructions sent to your email" });
  } catch (err) {
    console.error("Error in forgotPin:", err);
    res.status(500).json({ message: "Server error" });
  }
};



exports.resetPin = async (req, res) => {
  try {
    const { token, newPin } = req.body;

    if (!newPin || newPin.length !== 4) {
      return res.status(400).json({ message: "PIN must be exactly 4 digits" });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.transactionPin = await bcrypt.hash(newPin, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({ message: "✅ PIN reset successful!" });
  } catch (err) {
    console.error("Error in resetPin:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getMe = async (req, res) => {
  try {
    if (!req.user) return res.status(404).json({ message: "User not found" });

    const { name, email, profilePic } = req.user;
    res.json({ name, email, profilePic });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// controllers/userController.js
exports.updateProfilePicture = async (req, res) => {
  try {
    if (!req.user) return res.status(404).json({ message: "User not found" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    req.user.profilePic = req.file.path; // store file path in DB
    await req.user.save();

    res.json({ message: "Profile picture updated", profilePic: req.user.profilePic });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
