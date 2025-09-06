// controllers/adminController.js
const User = require("../models/User");
const Account = require("../models/Account"); // if needed
const sendEmail = require("../utils/sendEmail");
const Transaction = require("../models/Transaction");

// GET all users
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
    const { userId, amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get or create account
    let account = await Account.findOne({ userId: user._id });
    if (!account) {
      account = await Account.create({ userId: user._id, balance: 0 });
    }

    // Save old balance
    const balanceBefore = account.balance;

    // Update balance
    account.balance += amount;
    await account.save();

    // Create a transaction record
    const transaction = new Transaction({
      fromAccountId: account._id,       // you could also store "admin account" here if needed
      toAccountId: account._id,
      type: "deposit",
      amount,
      balanceBefore,
      balanceAfter: account.balance,
      description: `Admin funded user account`,
      status: "completed",
      channel: "admin",                 // ⚠️ make sure to add "admin" into the enum of Transaction.channel
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
