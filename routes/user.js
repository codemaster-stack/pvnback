// routes/userDashboard.js
const express = require("express");
const { getUserAccounts, deposit, withdraw, getAccountDetails, getUserProfile, submitContactMessage } = require("../controllers/userController");
const { protect } = require("../middleware/auth"); // make sure you have this
const { startChatSession, sendMessage, getChatMessages, getNewMessages, endChatSession, getChatHistory } = require("../controllers/chatController");


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

router.get('/profile', protect, getUserProfile);
router.post('/contact', protect, submitContactMessage);

// In your user routes file
router.post('/start', protect, startChatSession);

// Send a message (both user and admin can use this)
router.post('/message', protect, sendMessage);

// Get messages for current user's session
router.get('/messages/:sessionId', protect, getChatMessages);

// Get new messages since last check (for polling)
router.get('/messages/:sessionId/new', protect, getNewMessages);

// End chat session
router.post('/end/:sessionId', protect, endChatSession);

// Get user's chat history
router.get('/history', protect, getChatHistory);





module.exports = router;
