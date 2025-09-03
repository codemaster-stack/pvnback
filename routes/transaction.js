// routes/transactionRoutes.js
const express = require('express');
const { getUserTransactions,  transfer} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware'); // your JWT auth middleware

const router = express.Router();

router.get('/', protect, getUserTransactions);
// routes/userDashboard.js
router.post("/account/:fromAccountId/transfer", protect, transfer);


module.exports = router;
