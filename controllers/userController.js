// controllers/userDashboardController.js
const User = require("../models/User");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

// @desc    Get all accounts for logged-in user
// @route   GET /api/user/dashboard/accounts
// @access  Private
exports.getUserAccounts = async (req, res) => {
  try {
    const userId = req.user.id; // comes from auth middleware
    const accounts = await Account.findByUserId(userId);

    if (!accounts || accounts.length === 0) {
      return res.status(404).json({ message: "No accounts found for this user." });
    }

    // Optionally, include recent transactions for each account
    const accountsWithTransactions = await Promise.all(
      accounts.map(async (acc) => {
        const recentTransactions = await Transaction.findByAccountId(acc._id, 5); // last 5 transactions
        return {
          account: acc.toDisplayFormat(),
          recentTransactions: recentTransactions.map((tx) => tx.getSummary()),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: accountsWithTransactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching user accounts." });
  }
};


exports.getAccountDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountId } = req.params;

    // Make sure the account belongs to the logged-in user
    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }

    // Fetch all transactions for this account
    const transactions = await Transaction.findByAccountId(account._id, 100, 0); // last 100 transactions
    const formattedTransactions = transactions.map((tx) => tx.getSummary());

    res.status(200).json({
      success: true,
      data: {
        account: account.toDisplayFormat(),
        transactions: formattedTransactions,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching account details." });
  }
};



exports.deposit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountId } = req.params;
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than zero." });
    }

    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) return res.status(404).json({ message: "Account not found." });

    const balanceBefore = account.balance;
    account.balance += amount;
    await account.save();

    const transaction = await Transaction.create({
      fromAccountId: account._id,
      type: "deposit",
      category: "banking",
      amount,
      balanceBefore,
      balanceAfter: account.balance,
      description: description || "Deposit",
      channel: "online",
      status: "completed",
      transactionDate: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Deposit successful",
      account: account.toDisplayFormat(),
      transaction: transaction.getSummary(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error processing deposit." });
  }
};

// @desc    Withdraw money from an account
// @route   POST /api/user/dashboard/account/:accountId/withdraw
// @access  Private
exports.withdraw = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountId } = req.params;
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than zero." });
    }

    const account = await Account.findOne({ _id: accountId, userId });
    if (!account) return res.status(404).json({ message: "Account not found." });

    const check = account.canPerformTransaction(amount, "debit");
    if (!check.allowed) return res.status(400).json({ message: check.reason });

    const balanceBefore = account.balance;
    account.balance -= amount;
    await account.save();

    const transaction = await Transaction.create({
      fromAccountId: account._id,
      type: "withdrawal",
      category: "banking",
      amount,
      balanceBefore,
      balanceAfter: account.balance,
      description: description || "Withdrawal",
      channel: "online",
      status: "completed",
      transactionDate: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Withdrawal successful",
      account: account.toDisplayFormat(),
      transaction: transaction.getSummary(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error processing withdrawal." });
  }
};


exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id; // set by your protect middleware
        const user = await User.findById(userId).select('fullName email');

        const account = await Account.findOne({ userId }); // get primary account
        if (!user || !account) {
            return res.status(404).json({ message: 'User or account not found' });
        }

        res.json({
            user: {
                fullName: user.fullName,
                accountNumber: account.accountNumber,
                balance: account.balance
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};




// Express.js logout route handler
// POST /api/auth/logout


// Alternative version if using middleware for token verification
exports.logoutWithMiddleware = async (req, res) => {
    try {
        // If you have middleware that already verified the token and added user to req
        const userId = req.user?.id;
        const token = req.token; // Assuming middleware adds the token to req

        if (userId) {
            // Log user-specific logout
            console.log(`User ${userId} logged out at ${new Date().toISOString()}`);
            
            // Optional: Update last logout time in database
            // await User.findByIdAndUpdate(userId, { lastLogout: new Date() });
        }

        // Blacklist the token
        if (token) {
            // Add to blacklist (implement according to your setup)
            // await blacklistToken(token);
        }

        // Clear cookies
        res.clearCookie('authToken');

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during logout'
        });
    }
};

// Route setup (add this to your routes file)
// router.post('/api/auth/logout', logout);

// If using Express.js with middleware:
// router.post('/api/auth/logout', authenticateToken, logoutWithMiddleware);

// Middleware example for token verification (if needed)
exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        
        req.user = user;
        req.token = token;
        next();
    });
};

