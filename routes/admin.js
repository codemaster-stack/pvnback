// routes/adminRoutes.js
const express = require('express');
const {
  getAllUsers,
  createUser,
  deleteUser,
  sendEmailToUser,
  fundUserAccount
} = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');
const { replyToMessage } = require('../controllers/userController');
const { getActiveChatSessions, getUserChatHistory, getChatStats } = require("../controllers/chatController");

const router = express.Router();

// Protect all routes, only admins
router.use(adminAuth);

// Get all users
router.get('/users', getAllUsers);

// Create a new user
router.post('/create-user', createUser);

// Delete a user
router.delete('/delete-user/:id', deleteUser);

// Send email to a user
router.post('/send-email', sendEmailToUser);

// Fund user account
router.post('/fund-user', fundUserAccount);

// Add this route to your admin routes
router.put('/reply-message/:messageId', adminAuth, replyToMessage);

// In your admin routes file  
router.get('/admin/sessions', adminAuth, getActiveChatSessions);

// Get specific user's chat history (admin only)
router.get('/admin/user/:userId', adminAuth, getUserChatHistory);

// Get chat statistics (admin only)
router.get('/admin/stats', adminAuth, getChatStats);


module.exports = router;
