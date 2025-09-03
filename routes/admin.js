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


const router = express.Router();

// Protect all routes, only admins
router.use(adminAuth); 

// Get all users
router.get('/users', adminAuth, getAllUsers);

// Create a new user
router.post('/create-user', adminAuth, createUser);

// Delete a user
router.delete('/delete-user/:id', adminAuth, deleteUser);

// Send email to a user
router.post('/send-email', adminAuth, sendEmailToUser);

// Fund user account
router.post('/fund-user', adminAuth, fundUserAccount);

module.exports = router;
