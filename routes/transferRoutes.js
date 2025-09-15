// routes/transfer.js
const express = require("express");
const bcrypt = require("bcryptjs");
const { protect } = require("../middleware/auth");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const router = express.Router();

// POST /api/transfer
router.post("/", protect, async (req, res) => {
  try {
    const { amount, recipientAccount, recipientBank, recipientCountry, pin } = req.body;
    const user = await User.findById(req.user.id);

    // 1. Check transfer PIN
    if (!user.transferPinHash) {
      return res.status(400).json({ error: "No transfer PIN set" });
    }
    const isPinValid = await bcrypt.compare(pin, user.transferPinHash);
    if (!isPinValid) {
      return res.status(400).json({ error: "Invalid PIN" });
    }

    // 2. Check balance
    if (user.balances.current < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    // 3. Deduct balance
    user.balances.current -= amount;
    await user.save();

    // 4. Record transaction
    const tx = new Transaction({
      userId: user._id,
      description: `Transfer to ${recipientAccount} (${recipientBank}, ${recipientCountry})`,
      amount: -amount,
      type: "outflow",
      balanceAfter: user.balances.current,
    });
    await tx.save();

    res.json({ success: true, newBalance: user.balances.current });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
