// routes/transactionRoutes.js
const express = require('express');
const { getUserTransactions,  transfer} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth'); // your JWT auth middleware
// const { adMinauth } = require('../middleware/adminAuth');

const router = express.Router();

router.get('/', protect, getUserTransactions);
// routes/userDashboard.js
// router.post("/account/:fromAccountId/transfer", protect, transfer);
// routes/transactionRoutes.js
router.post("/transfer", protect, transfer);



module.exports = router;
