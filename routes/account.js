// routes/account.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// Get balances + recent transactions
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("name email phone balances");
    if (!user) return res.status(404).json({ message: "User not found" });

    const transactions = await Transaction.find({ userId: user._id })
      .sort({ date: -1 })
      .limit(10);

    res.json({ user, transactions });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Add a transaction and update balances
router.post("/transaction", protect, async (req, res) => {
  try {
    const { type, amount, description } = req.body;

    if (!["deposit", "withdrawal", "transfer", "loan"].includes(type)) {
      return res.status(400).json({ message: "Invalid transaction type" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // update balances
    if (type === "deposit") user.balances.current += amount;
    if (type === "withdrawal" || type === "transfer") user.balances.current -= amount;
    if (type === "loan") user.balances.loan += amount;

    // save transaction separately
    const tx = new Transaction({
      userId: user._id,
      type,
      amount,
      description
    });

    await user.save();
    await tx.save();

    res.json({ message: "Transaction recorded", balances: user.balances, transaction: tx });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
