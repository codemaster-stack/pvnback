// routes/userDashboard.js
const express = require("express");
const { getUserAccounts, deposit, withdraw, getAccountDetails } = require("../controllers/userController");
const { protect } = require("../middleware/auth"); // make sure you have this


const router = express.Router();

// Get all accounts + recent transactions for user
router.get("/accounts", protect, getUserAccounts);
// routes/userDashboard.js
// ...existing imports and code

// Get details for a single account with all transactions
router.get("/account/:accountId", protect, getAccountDetails);


router.post("/account/:accountId/deposit", protect, deposit);

// Withdraw
router.post("/account/:accountId/withdraw", protect, withdraw);


module.exports = router;
