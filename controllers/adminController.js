// controllers/adminController.js
const User = require("../models/User");
const Account = require("../models/Account"); // if needed
const sendEmail = require("../utils/sendEmail");

// GET all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }).select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching users" });
  }
};

// Admin creates a new user
exports.createUser = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ fullName, email, phone, password, role: "user" });

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error creating user" });
  }
};

// Admin deletes a user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.remove();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error deleting user" });
  }
};

// Admin funds user account
exports.fundUserAccount = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Optional: create or update account balance
    let account = await Account.findOne({ userId: user._id });
    if (!account) {
      account = await Account.create({ userId: user._id, balance: 0 });
    }
    account.balance += amount;
    await account.save();

    res.status(200).json({ message: `User funded with $${amount}`, balance: account.balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error funding user" });
  }
};

// Admin sends email
exports.sendEmailToUser = async (req, res) => {
  try {
    const { userId, subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ message: "Subject and message required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await sendEmail({ to: user.email, subject, text: message });
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send email" });
  }
};
