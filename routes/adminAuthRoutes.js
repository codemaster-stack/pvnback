// // routes/adminRoutes.js
// const express = require('express');
// const {
//   getAllUsers,
//   deleteUser,
//   sendEmailToUser,
//   fundUserAccount,
//   getContactMessages
// } = require('../controllers/adminController');
// const adminAuth = require('../middleware/adminAuth');
// const { replyToMessage } = require('../controllers/userController');
// // FIX 1: Add sendMessage, getChatMessages, getNewMessages to imports
// const { getActiveChatSessions, getUserChatHistory, getChatStats, sendMessage, getChatMessages, getNewMessages  } = require("../controllers/chatController");

// const router = express.Router();
// const { protect } = require('../middleware/auth'); // Import JWT middleware

// // First verify JWT, then check admin
// router.use(protect);   // This sets req.user from database
// router.use(adminAuth); // This checks if req.user.role === 'admin'

// // Get all users
// router.get('/users', getAllUsers);

// // Delete a user
// router.delete('/delete-user/:id', deleteUser);

// // Send email to a user
// router.post('/send-email', sendEmailToUser);

// // Fund user account
// router.post('/fund-user', fundUserAccount);

// // Add this route to your admin routes
// router.put('/reply-message/:messageId', adminAuth, replyToMessage);

// // FIX 2: Clean up chat routes - remove duplicate adminAuth and /admin prefixes
// router.get('/sessions', getActiveChatSessions);
// router.get('/user/:userId', getUserChatHistory);
// router.get('/stats', getChatStats);

// // FIX 3: Add missing message routes for admin
// router.post('/message', sendMessage);
// router.get('/messages/:sessionId', getChatMessages);
// router.get('/messages/:sessionId/new', getNewMessages);

// router.get('/contact-messages', getContactMessages);


// module.exports = router;


const express = require("express");
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  forgotPassword,
  resetPassword
} = require("../controllers/adminController");

// @route POST /api/auth/admin/register
router.post("/register", registerAdmin);

// @route POST /api/auth/admin/login
router.post("/login", loginAdmin);

// @route POST /api/auth/admin/forgot-password
router.post("/forgot-password", forgotPassword);

// @route POST /api/auth/admin/reset-password/:token
router.post("/reset-password/:token", resetPassword);

module.exports = router;
