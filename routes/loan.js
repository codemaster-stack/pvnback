// routes/loan.js
const express = require("express");
const router = express.Router();
const LoanApplication = require("../models/loanApplication");

// Save new application
router.post("/apply", async (req, res) => {
  try {
    const application = new LoanApplication(req.body);
    await application.save();
    res.json({ success: true, message: "Application submitted!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error saving application" });
  }
});

// Get unread count (for admin notifications)
router.get("/unread-count", async (req, res) => {
  try {
    const count = await LoanApplication.countDocuments({ status: "unread" });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Error fetching count" });
  }
});

// Mark applications as read
router.post("/mark-read/:id", async (req, res) => {
  try {
    await LoanApplication.findByIdAndUpdate(req.params.id, { status: "read" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;
