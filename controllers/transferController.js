// controllers/transactionController.js
// const Transaction = require('../models/Transaction');
// const Account = require("../models/Account");
// const User = require('../models/User');

// // @desc    Get recent transactions for logged-in user
// // @route   GET /api/transactions
// // @access  Private
// // controllers/transactionController.js
// exports.getUserTransactions = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // Find account by userId instead of user.accountId
//     const account = await Account.findOne({ userId: userId });
//     if (!account) {
//       return res.status(404).json({ message: 'No account found for user' });
//     }

//     // Get transactions for this account
//     const transactions = await Transaction.findByAccountId(account._id);
    
//     // Convert to summary format
//     const summary = transactions.map(txn => txn.getSummary());

//     res.status(200).json({ 
//       transactions: summary,
//       count: summary.length 
//     });

//   } catch (error) {
//     console.error('Error fetching transactions:', error);
//     res.status(500).json({ message: 'Server error fetching transactions' });
//   }
// };


// // controllers/userDashboardController.js
// // controllers/transactionController.js
// // controllers/transactionController.js
// exports.transfer = async (req, res) => {
//   try {
//     const userId = req.body.fromUserId; // send from frontend
//     const { toAccountNumber, amount, description, date } = req.body;

//     if (!toAccountNumber || !amount || amount <= 0) {
//       return res.status(400).json({ message: "Destination account and valid amount required." });
//     }

//     // Get the user's primary account
//     const fromAccount = await Account.findOne({ userId });
//     if (!fromAccount) return res.status(404).json({ message: "Source account not found." });

//     const toAccount = await Account.findOne({ accountNumber: toAccountNumber });
//     if (!toAccount) return res.status(404).json({ message: "Destination account not found." });

//     if (fromAccount.balance < amount) {
//       return res.status(400).json({ message: "Insufficient funds." });
//     }

//     const fromBalanceBefore = fromAccount.balance;
//     const toBalanceBefore = toAccount.balance;

//     fromAccount.balance -= amount;
//     toAccount.balance += amount;

//     await fromAccount.save();
//     await toAccount.save();

//   const fromTransaction = await Transaction.create({
//   fromAccountId: fromAccount._id,
//   toAccountId: toAccount._id,
//   type: "transfer",
//   category: "banking",
//   amount,
//   balanceBefore: fromBalanceBefore,
//   balanceAfter: fromAccount.balance,
//   description: description || `Transfer to ${toAccount.accountNumber}`,
//   channel: "online",
//   status: "completed",
//   transactionDate: date ? new Date(date) : new Date(), // Use custom date here too
// });

//     const toTransaction = await Transaction.create({
//       fromAccountId: fromAccount._id,
//       toAccountId: toAccount._id,
//       type: "deposit",
//       category: "banking",
//       amount: -amount,
//       balanceBefore: toBalanceBefore,
//       balanceAfter: toAccount.balance,
//       description: description || `Transfer from ${fromAccount.accountNumber}`,
//       channel: "online",
//       status: "completed",
//       transactionDate: date ? new Date(date) : new Date(),
//     });

//     res.status(200).json({
//       success: true,
//       message: "Transfer successful",
//       fromAccount: fromAccount,
//       toAccount: toAccount,
//       transaction: fromTransaction,
//     });
//     console.log("Transfer body:", req.body);
//     console.log("From account:", fromAccount);
//     console.log("To account:", toAccount);

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error processing transfer." });
//   }
// };





// controllers/transactionController.js
// controllers/transactionController.js


const User = require("../models/User");
const Transaction = require("../models/Transaction");
const bcrypt = require("bcryptjs");
const { Parser } = require("json2csv");

// @desc    Transfer funds
// @route   POST /api/transactions/transfer
// @access  Private
// controllers/transactionController.js

exports.transfer = async (req, res) => {
  try {
    const {
      amount,
      accountNumber,
      recipientBank,
      recipientCountry,
      description,
      fromAccountType,
      toAccountType,
      pin
    } = req.body;

    // --- 1. Validate amount ---
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid transfer amount" });
    }

    // --- 2. Validate account types ---
    const validTypes = ["savings", "current"];
    if (
      !validTypes.includes(fromAccountType) ||
      !validTypes.includes(toAccountType)
    ) {
      return res.status(400).json({ message: "Invalid account type" });
    }

    // --- 3. Find sender ---
    const sender = await User.findById(req.user.id).select("+transactionPin");
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    // --- 4. Verify PIN ---
    const isMatch = await sender.matchPin(pin);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid PIN" });
    }

    // --- 5. Check sender balance ---
    if (sender.balances[fromAccountType] < amount) {
      return res.status(400).json({
        message: `Insufficient balance in ${fromAccountType}`
      });
    }

    // --- 6. Find recipient ---
    const recipient = await User.findOne({
      $or: [
        { savingsAccountNumber: accountNumber },
        { currentAccountNumber: accountNumber }
      ]
    });
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // --- 7. Debit sender & credit recipient ---
    sender.balances[fromAccountType] -= amount;
    sender.balances.outflow += amount;

    recipient.balances[toAccountType] += amount;
    recipient.balances.inflow += amount;

    await sender.save();
    await recipient.save();

    // --- 8. Save transaction logs ---
    await Transaction.create({
      userId: sender._id,
      type: "outflow",
      amount,
      description:
        description ||
        `Transfer to ${accountNumber} (${recipientBank}, ${recipientCountry})`,
      fromAccountType,
      toAccountType,
      accountNumber,
      balanceAfter: sender.balances[fromAccountType]
    });

    await Transaction.create({
      userId: recipient._id,
      type: "inflow",
      amount,
      description:
        description || `Transfer from ${sender.fullname}`,
      fromAccountType,
      toAccountType,
      accountNumber: fromAccountType === "savings"
        ? sender.savingsAccountNumber
        : sender.currentAccountNumber,
      balanceAfter: recipient.balances[toAccountType]
    });

    // --- 9. Mask recipient account for frontend message ---
    const masked =
      accountNumber.slice(0, 4) + "****" + accountNumber.slice(-2);

    // --- 10. Send success response ---
    res.json({
      message: "✅ Transfer successful",
      balances: sender.balances,
      recipientMasked: masked
    });

  } catch (err) {
    console.error("Error in transfer:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getTransactionHistory = async (req, res) => {
  try {
    const { start, end } = req.query;

    const filter = { userId: req.user.id };
    if (start && end) {
      filter.createdAt = {
        $gte: new Date(start),
        $lte: new Date(new Date(end).setHours(23, 59, 59))
      };
    }

    const transactions = await Transaction.find(filter).sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Download transaction statement (CSV)
// @route   GET /api/transactions/statement?start=YYYY-MM-DD&end=YYYY-MM-DD
// @access  Private
exports.downloadStatement = async (req, res) => {
  try {
    const { start, end } = req.query;

    const filter = { userId: req.user.id };
    if (start && end) {
      filter.createdAt = {
        $gte: new Date(start),
        $lte: new Date(new Date(end).setHours(23, 59, 59))
      };
    }

    const transactions = await Transaction.find(filter).sort({ createdAt: -1 });

    if (transactions.length === 0) {
      return res.status(404).json({ message: "No transactions found" });
    }

    // Prepare CSV fields
    const fields = [
      { label: "Date", value: row => new Date(row.createdAt).toLocaleString() },
      { label: "Description", value: "description" },
      { label: "Amount", value: "amount" },
      { label: "Type", value: "type" },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(transactions);

    res.header("Content-Type", "text/csv");
    res.attachment("statement.csv");
    return res.send(csv);
  } catch (err) {
    console.error("Error generating statement:", err);
    res.status(500).json({ message: "Server error" });
  }
};


