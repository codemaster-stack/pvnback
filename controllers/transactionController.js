// controllers/transactionController.js
const Transaction = require('../models/Transaction');
const Account = require("../models/Account");
const User = require('../models/User');

// @desc    Get recent transactions for logged-in user
// @route   GET /api/transactions
// @access  Private
// controllers/transactionController.js
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find account by userId instead of user.accountId
    const account = await Account.findOne({ userId: userId });
    if (!account) {
      return res.status(404).json({ message: 'No account found for user' });
    }

    // Get transactions for this account
    const transactions = await Transaction.findByAccountId(account._id);
    
    // Convert to summary format
    const summary = transactions.map(txn => txn.getSummary());

    res.status(200).json({ 
      transactions: summary,
      count: summary.length 
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
};


// controllers/userDashboardController.js
// controllers/transactionController.js
// controllers/transactionController.js
exports.transfer = async (req, res) => {
  try {
    const userId = req.body.fromUserId; // send from frontend
    const { toAccountNumber, amount, description } = req.body;

    if (!toAccountNumber || !amount || amount <= 0) {
      return res.status(400).json({ message: "Destination account and valid amount required." });
    }

    // Get the user's primary account
    const fromAccount = await Account.findOne({ userId });
    if (!fromAccount) return res.status(404).json({ message: "Source account not found." });

    const toAccount = await Account.findOne({ accountNumber: toAccountNumber });
    if (!toAccount) return res.status(404).json({ message: "Destination account not found." });

    if (fromAccount.balance < amount) {
      return res.status(400).json({ message: "Insufficient funds." });
    }

    const fromBalanceBefore = fromAccount.balance;
    const toBalanceBefore = toAccount.balance;

    fromAccount.balance -= amount;
    toAccount.balance += amount;

    await fromAccount.save();
    await toAccount.save();

    const fromTransaction = await Transaction.create({
      fromAccountId: fromAccount._id,
      toAccountId: toAccount._id,
      type: "transfer",
      category: "banking",
      amount,
      balanceBefore: fromBalanceBefore,
      balanceAfter: fromAccount.balance,
      description: description || `Transfer to ${toAccount.accountNumber}`,
      channel: "online",
      status: "completed",
      transactionDate: new Date(),
    });

    const toTransaction = await Transaction.create({
      fromAccountId: fromAccount._id,
      toAccountId: toAccount._id,
      type: "deposit",
      category: "banking",
      amount,
      balanceBefore: toBalanceBefore,
      balanceAfter: toAccount.balance,
      description: description || `Transfer from ${fromAccount.accountNumber}`,
      channel: "online",
      status: "completed",
      transactionDate: date ? new Date(date) : new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Transfer successful",
      fromAccount: fromAccount,
      toAccount: toAccount,
      transaction: fromTransaction,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error processing transfer." });
  }
};
