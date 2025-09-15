const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');  // ✅ fix
const Transaction = require('../models/Transaction');
const User = require("../models/User");

// GET /api/transactions?limit=20
router.get('/', protect, async (req, res) => {
  const limit = parseInt(req.query.limit || '20', 10);
  try {
    const tx = await Transaction.find({ userId: req.user._id })
      .sort({ date: -1 })
      .limit(limit);

    res.json(tx);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { amount, recipient } = req.body;

    if (!amount || !recipient) {
      return res.status(400).json({ message: "Amount and recipient required" });
    }

    const sender = await User.findById(req.user._id);
    const receiver = await User.findOne({ accountNumber: recipient });

    if (!receiver) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    if (sender.balances.current < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    // Deduct and credit
    sender.balances.current -= amount;
    receiver.balances.current += amount;

    await sender.save();
    await receiver.save();

    // Record transaction
    const tx = await Transaction.create({
      userId: sender._id,
      type: "debit",
      amount,
      to: recipient,
    });

    res.json({ message: "Transfer started", tx });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
