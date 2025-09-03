// routes/adminRoutes.js
const express = require('express');
const {
  getAllUsers,
  createUser,
  deleteUser,
  sendEmailToUser,
  fundUserAccount
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes, only admins
router.use(protect); 

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

module.exports = router;
