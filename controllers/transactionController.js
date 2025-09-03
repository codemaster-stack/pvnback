// controllers/transactionController.js
const Transaction = require('../models/Transaction');
const Account = require("../models/Account");
const User = require('../models/User');

// @desc    Get recent transactions for logged-in user
// @route   GET /api/transactions
// @access  Private
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Assuming each user has one main account linked by accountId
    const user = await User.findById(userId).populate('accountId'); 
    if (!user) return res.status(404).json({ message: 'User not found' });

    const accountId = user.accountId;

    const transactions = await Transaction.findByAccountId(accountId);

    // Return the summary for frontend
    const summary = transactions.map(txn => txn.getSummary());

    res.status(200).json({ transactions: summary });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
};


// controllers/userDashboardController.js
exports.transfer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fromAccountId } = req.params;
    const { toAccountNumber, amount, description } = req.body;

    if (!toAccountNumber || !amount || amount <= 0) {
      return res.status(400).json({ message: "Destination account and valid amount required." });
    }

    const fromAccount = await Account.findOne({ _id: fromAccountId, userId });
    if (!fromAccount) return res.status(404).json({ message: "Source account not found." });

    const check = fromAccount.canPerformTransaction(amount, "debit");
    if (!check.allowed) return res.status(400).json({ message: check.reason });

    const toAccount = await Account.findByAccountNumber(toAccountNumber);
    if (!toAccount) return res.status(404).json({ message: "Destination account not found." });

    // Update balances
    const fromBalanceBefore = fromAccount.balance;
    const toBalanceBefore = toAccount.balance;

    fromAccount.balance -= amount;
    toAccount.balance += amount;

    await fromAccount.save();
    await toAccount.save();

    // Create transactions for both accounts
    const fromTransaction = await Transaction.create({
      fromAccountId: fromAccount._id,
      toAccountId: toAccount._id,
      type: "transfer",
      category: "banking",
      amount,
      balanceBefore: fromBalanceBefore,
      balanceAfter: fromAccount.balance,
      description: description || `Transfer to ${toAccount.maskedAccountNumber}`,
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
      description: description || `Transfer from ${fromAccount.maskedAccountNumber}`,
      channel: "online",
      status: "completed",
      transactionDate: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Transfer successful",
      fromAccount: fromAccount.toDisplayFormat(),
      toAccount: toAccount.toDisplayFormat(),
      transaction: fromTransaction.getSummary(),
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error processing transfer." });
  }
};