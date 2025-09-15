// backend/routes/supportRoutes.js
const express = require('express');
const router = express.Router();
const {
  createMessage,
  getAllMessages,
  getMessageById,
  replyToMessage,
  getUserMessages,
  getMessagesByEmail,
  markReadAdmin
} = require('../controllers/supportController');

const { protect } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public - anyone (guest or logged-in) can create message
router.post('/messages', createMessage);

// Admin-only endpoints
// Admin-only endpoints
router.get('/messages', protect, adminAuth, getAllMessages);
router.get('/messages/:id', protect, adminAuth, getMessageById);
router.post('/messages/:id/reply', protect, adminAuth, replyToMessage);
router.patch('/messages/:id/mark-read', protect, adminAuth, markReadAdmin);

// Logged-in user: get their messages
router.get('/user/messages', protect, getUserMessages);

// Public: get messages by email for guest to poll (use with caution)
router.get('/email/messages', getMessagesByEmail);

module.exports = router;
