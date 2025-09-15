// // controllers/adminController.js
// const Admin = require("../models/adminModel");
// const User = require("../models/User");
// const Account = require("../models/Account"); // if needed
// const sendEmail = require("../utils/sendEmail");
// const Transaction = require("../models/Transaction");
// const ContactMessage = require("../models/Contact" );
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
// const crypto = require("crypto");





// exports.forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const admin = await Admin.findOne({ email });
//     if (!admin) {
//       return res.status(400).json({ message: "No admin with that email" });
//     }

//     // Generate token
//     const resetToken = crypto.randomBytes(20).toString("hex");

//     admin.resetPasswordToken = crypto
//       .createHash("sha256")
//       .update(resetToken)
//       .digest("hex");
//     admin.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

//     await admin.save();

//     const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;
//     const message = `You requested a password reset. Click this link: ${resetUrl}`;

//     await sendEmail({
//       email: admin.email,
//       subject: "Password reset",
//       message,
//     });

//     res.json({ message: "Email sent" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // @desc Reset Password
// exports.resetPassword = async (req, res) => {
//   try {
//     const resetPasswordToken = crypto
//       .createHash("sha256")
//       .update(req.params.token)
//       .digest("hex");

//     const admin = await Admin.findOne({
//       resetPasswordToken,
//       resetPasswordExpire: { $gt: Date.now() },
//     });

//     if (!admin) {
//       return res.status(400).json({ message: "Invalid or expired token" });
//     }

//     const hashedPassword = await bcrypt.hash(req.body.password, 10);

//     admin.password = hashedPassword;
//     admin.resetPasswordToken = undefined;
//     admin.resetPasswordExpire = undefined;

//     await admin.save();

//     res.json({ message: "Password updated successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// };





const Admin = require("../models/adminModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail"); // you should already have this util

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id, role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc Register admin
exports.registerAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      username,
      email,
      password: hashedPassword,
      role: "admin"
    });

    res.status(201).json({
      _id: admin.id,
      username: admin.username,
      email: admin.email,
      token: generateToken(admin.id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Login admin
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      _id: admin.id,
      username: admin.username,
      email: admin.email,
      token: generateToken(admin.id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "No admin with that email" });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString("hex");

    admin.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    admin.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await admin.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;
    const message = `You requested a password reset. Click this link: ${resetUrl}`;

    await sendEmail({
      email: admin.email,
      subject: "Password reset",
      message,
    });

    res.json({ message: "Email sent" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const admin = await Admin.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    admin.password = hashedPassword;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;

    await admin.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};




// // GET all users
exports.getAllUsers = async (req, res) => {
  try {
    // 1. Get all non-admin users
    const users = await User.find({ role: { $ne: "admin" } })
      .select("-password")
      .lean(); // lean() makes it plain JS objects

    // 2. Get accounts for those users
    const accounts = await Account.find({
      userId: { $in: users.map((u) => u._id) },
    }).lean();

    // 3. Merge account info into each user
    const usersWithAccounts = users.map((user) => {
      const account = accounts.find(
        (a) => a.userId.toString() === user._id.toString()
      );

      return {
        ...user,
        accountNumber: account ? account.accountNumber : null,
        balance: account ? account.balance : 0,
      };
    });

    res.status(200).json(usersWithAccounts);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Server error fetching users", error: error.message });
  }
};
// Admin deletes a user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;  // Changed from 'userId' to 'id'
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await User.findByIdAndDelete(id);  // Also updated this line
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error deleting user" });
  }
};

// Admin funds user account
exports.fundUserAccount = async (req, res) => {
  try {
    const { userId, amount, description, date } = req.body;  // 👈 now accept date
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let account = await Account.findOne({ userId: user._id });
    if (!account) {
      account = await Account.create({ userId: user._id, balance: 0 });
    }

    const balanceBefore = account.balance;
    account.balance += amount;
    await account.save();

    const transaction = new Transaction({
      fromAccountId: account._id,
      toAccountId: account._id,
      type: "deposit",
      amount,
      balanceBefore,
      balanceAfter: account.balance,
      description: description || "Admin funded user account",
      status: "completed",
      channel: "admin",
      transactionDate: date ? new Date(date) : new Date()   // 👈 use admin’s chosen date or default now
    });

    await transaction.save();

    res.status(200).json({
      message: `User funded with $${amount}`,
      balance: account.balance,
      transaction: transaction.getSummary(),
    });

  } catch (error) {
    console.error("Error funding user:", error);
    res.status(500).json({ message: "Server error funding user" });
  }
};


// // Admin sends email
// exports.sendEmailToUser = async (req, res) => {
//   try {
//     const { userId, subject, message } = req.body;
//     if (!subject || !message) return res.status(400).json({ message: "Subject and message required" });

//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     await sendEmail({ to: user.email, subject, text: message });
//     res.status(200).json({ message: "Email sent successfully" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Failed to send email" });
//   }
// };


// exports.getContactMessages = async (req, res) => {
//   try {
//     const messages = await ContactMessage.find()
//       .populate('userId', 'fullName email')  // include user info
//       .sort({ createdAt: -1 });

//     res.json(messages);
//   } catch (error) {
//     console.error('Error fetching messages:', error);
//     res.status(500).json({ message: 'Error fetching messages' });
//   }
// };