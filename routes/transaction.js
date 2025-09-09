const express = require('express');
const {
  getUserTransactions,
  transfer,
 
} = require('../controllers/transactionController');
const { downloadStatement } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Fetch all user transactions (with optional date filters)
router.get('/', protect, getUserTransactions);

// Make a transfer
router.post('/transfer', protect, transfer);

// Download statements as PDF
router.get('/statements', protect, downloadStatement);

module.exports = router;
