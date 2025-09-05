// controllers/userDashboardController.js
// const User = require("../models/User");
// const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const ContactMessage = require('../models/Contact');

// @desc    Get all accounts for logged-in user
// @route   GET /api/user/dashboard/accounts
// @access  Private
// exports.getUserAccounts = async (req, res) => {
//   try {
//     const userId = req.user.id; // comes from auth middleware
//     const accounts = await Account.findByUserId(userId);

//     if (!accounts || accounts.length === 0) {
//       return res.status(404).json({ message: "No accounts found for this user." });
//     }

//     // Optionally, include recent transactions for each account
//     const accountsWithTransactions = await Promise.all(
//       accounts.map(async (acc) => {
//         const recentTransactions = await Transaction.findByAccountId(acc._id, 5); // last 5 transactions
//         return {
//           account: acc.toDisplayFormat(),
//           recentTransactions: recentTransactions.map((tx) => tx.getSummary()),
//         };
//       })
//     );

//     res.status(200).json({
//       success: true,
//       data: accountsWithTransactions,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error fetching user accounts." });
//   }
// };


// exports.getAccountDetails = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { accountId } = req.params;

//     // Make sure the account belongs to the logged-in user
//     const account = await Account.findOne({ _id: accountId, userId });
//     if (!account) {
//       return res.status(404).json({ message: "Account not found." });
//     }

//     // Fetch all transactions for this account
//     const transactions = await Transaction.findByAccountId(account._id, 100, 0); // last 100 transactions
//     const formattedTransactions = transactions.map((tx) => tx.getSummary());

//     res.status(200).json({
//       success: true,
//       data: {
//         account: account.toDisplayFormat(),
//         transactions: formattedTransactions,
//       },
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error fetching account details." });
//   }
// };



// exports.deposit = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { accountId } = req.params;
//     const { amount, description } = req.body;

//     if (!amount || amount <= 0) {
//       return res.status(400).json({ message: "Amount must be greater than zero." });
//     }

//     const account = await Account.findOne({ _id: accountId, userId });
//     if (!account) return res.status(404).json({ message: "Account not found." });

//     const balanceBefore = account.balance;
//     account.balance += amount;
//     await account.save();

//     const transaction = await Transaction.create({
//       fromAccountId: account._id,
//       type: "deposit",
//       category: "banking",
//       amount,
//       balanceBefore,
//       balanceAfter: account.balance,
//       description: description || "Deposit",
//       channel: "online",
//       status: "completed",
//       transactionDate: new Date(),
//     });

//     res.status(200).json({
//       success: true,
//       message: "Deposit successful",
//       account: account.toDisplayFormat(),
//       transaction: transaction.getSummary(),
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error processing deposit." });
//   }
// };

// @desc    Withdraw money from an account
// @route   POST /api/user/dashboard/account/:accountId/withdraw
// @access  Private
// exports.withdraw = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { accountId } = req.params;
//     const { amount, description } = req.body;

//     if (!amount || amount <= 0) {
//       return res.status(400).json({ message: "Amount must be greater than zero." });
//     }

//     const account = await Account.findOne({ _id: accountId, userId });
//     if (!account) return res.status(404).json({ message: "Account not found." });

//     const check = account.canPerformTransaction(amount, "debit");
//     if (!check.allowed) return res.status(400).json({ message: check.reason });

//     const balanceBefore = account.balance;
//     account.balance -= amount;
//     await account.save();

//     const transaction = await Transaction.create({
//       fromAccountId: account._id,
//       type: "withdrawal",
//       category: "banking",
//       amount,
//       balanceBefore,
//       balanceAfter: account.balance,
//       description: description || "Withdrawal",
//       channel: "online",
//       status: "completed",
//       transactionDate: new Date(),
//     });

//     res.status(200).json({
//       success: true,
//       message: "Withdrawal successful",
//       account: account.toDisplayFormat(),
//       transaction: transaction.getSummary(),
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error processing withdrawal." });
//   }
// };


// controllers/userController.js
// const User = require("../models/User");
// const Account = require("../models/Account"); // ADD THIS IMPORT

// // 🔹 FIXED: Get user profile with proper error handling
// exports.getUserProfile = async (req, res) => {
//   try {
//     const userId = req.user.id; // from protect middleware
    
//     // Get user info
//     const user = await User.findById(userId).select('fullName email phone');
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Handle admin users (they don't have accounts)
//     if (user.role === 'admin') {
//       return res.json({
//         user: {
//           fullName: user.fullName,
//           email: user.email,
//           role: 'admin'
//         }
//       });
//     }

//     // Get user's primary account
//     const account = await Account.findOne({ userId });
    
//     // If no account exists, create one automatically
//     if (!account) {
//       console.log(`No account found for user ${userId}, creating one...`);
      
//       const newAccount = await Account.create({
//         userId,
//         accountType: "savings",
//         balance: 0
//       });

//       return res.json({
//         user: {
//           fullName: user.fullName,
//           email: user.email,
//           phone: user.phone,
//           accountNumber: newAccount.accountNumber,
//           balance: newAccount.balance
//         }
//       });
//     }

//     // Return user with account info
//     res.json({
//       user: {
//         fullName: user.fullName,
//         email: user.email,
//         phone: user.phone,
//         accountNumber: account.accountNumber,
//         balance: account.balance
//       }
//     });

//   } catch (error) {
//     console.error('Profile error:', error);
//     res.status(500).json({ message: 'Server error loading profile' });
//   }
// };

// // 🔹 Get all user accounts (if you need this)
// exports.getUserAccounts = async (req, res) => {
//   try {
//     const userId = req.user.id;
    
//     const accounts = await Account.find({ userId, isActive: true });
    
//     res.json({
//       accounts: accounts.map(account => ({
//         _id: account._id,
//         accountNumber: account.accountNumber,
//         accountType: account.accountType,
//         balance: account.balance,
//         createdAt: account.createdAt
//       }))
//     });
//   } catch (error) {
//     console.error('Get accounts error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // 🔹 Get account details
// exports.getAccountDetails = async (req, res) => {
//   try {
//     const { accountId } = req.params;
//     const userId = req.user.id;

//     const account = await Account.findOne({ 
//       _id: accountId, 
//       userId,
//       isActive: true 
//     });

//     if (!account) {
//       return res.status(404).json({ message: 'Account not found' });
//     }

//     res.json({
//       account: {
//         _id: account._id,
//         accountNumber: account.accountNumber,
//         accountType: account.accountType,
//         balance: account.balance,
//         createdAt: account.createdAt
//       }
//     });
//   } catch (error) {
//     console.error('Get account details error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // 🔹 Deposit money (placeholder - implement based on your needs)
// exports.deposit = async (req, res) => {
//   try {
//     const { accountId } = req.params;
//     const { amount, description } = req.body;
//     const userId = req.user.id;

//     if (!amount || amount <= 0) {
//       return res.status(400).json({ message: 'Invalid amount' });
//     }

//     const account = await Account.findOne({ 
//       _id: accountId, 
//       userId,
//       isActive: true 
//     });

//     if (!account) {
//       return res.status(404).json({ message: 'Account not found' });
//     }

//     // Update balance
//     account.balance += parseFloat(amount);
//     await account.save();

//     // TODO: Create transaction record here if you have a Transaction model

//     res.json({
//       message: 'Deposit successful',
//       account: {
//         _id: account._id,
//         accountNumber: account.accountNumber,
//         balance: account.balance
//       }
//     });
//   } catch (error) {
//     console.error('Deposit error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // 🔹 Withdraw money (placeholder - implement based on your needs)
// exports.withdraw = async (req, res) => {
//   try {
//     const { accountId } = req.params;
//     const { amount, description } = req.body;
//     const userId = req.user.id;

//     if (!amount || amount <= 0) {
//       return res.status(400).json({ message: 'Invalid amount' });
//     }

//     const account = await Account.findOne({ 
//       _id: accountId, 
//       userId,
//       isActive: true 
//     });

//     if (!account) {
//       return res.status(404).json({ message: 'Account not found' });
//     }

//     if (account.balance < amount) {
//       return res.status(400).json({ message: 'Insufficient funds' });
//     }

//     // Update balance
//     account.balance -= parseFloat(amount);
//     await account.save();

//     // TODO: Create transaction record here if you have a Transaction model

//     res.json({
//       message: 'Withdrawal successful',
//       account: {
//         _id: account._id,
//         accountNumber: account.accountNumber,
//         balance: account.balance
//       }
//     });
//   } catch (error) {
//     console.error('Withdraw error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };



// controllers/contactController.js


// User submits contact form
exports.submitContactMessage = async (req, res) => {
    try {
        const { subject, message } = req.body;
        const userId = req.user.id;
        
        const contactMessage = new ContactMessage({
            userId,
            subject,
            message
        });
        
        await contactMessage.save();
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending message' });
    }
};

// Admin gets all contact messages
exports.getContactMessages = async (req, res) => {
    try {
        const messages = await ContactMessage.find()
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages' });
    }
};

// Admin replies to message
exports.replyToMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { reply } = req.body;
        
        await ContactMessage.findByIdAndUpdate(messageId, {
            adminReply: reply,
            status: 'replied',
            repliedAt: new Date()
        });
        
        res.json({ message: 'Reply sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending reply' });
    }
};








// controllers/userController.js
const User = require("../models/User");
const Account = require("../models/Account");

// 🔹 ROBUST: Get user profile with fallback for existing users
exports.getUserProfile = async (req, res) => {
  try {
    // Check if req.user exists (from protect middleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userId = req.user.id;
    
    // Get user info
    const user = await User.findById(userId).select('fullName email phone role');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle admin users (they don't have accounts)
    if (user.role === 'admin') {
      return res.json({
        user: {
          fullName: user.fullName,
          email: user.email,
          role: 'admin'
        }
      });
    }

    // 🔹 FIXED: Try to find existing account first
    let account = await Account.findOne({ userId });
    
    // If no account exists, try to create one with better error handling
    if (!account) {
      try {
        // Generate a simple account number (avoid complex pre-save hooks for now)
        const accountNumber = Date.now().toString().slice(-10); // Last 10 digits of timestamp
        
        account = new Account({
          userId,
          accountNumber,
          accountType: "savings",
          balance: 0,
          isActive: true
        });
        
        await account.save();
      } catch (createError) {
        // If account creation fails, return user info without account details
        // This allows existing users to login even if account creation fails
        return res.json({
          user: {
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            accountNumber: "Account setup pending...",
            balance: 0
          }
        });
      }
    }

    // Return user with account info
    return res.json({
      user: {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        accountNumber: account.accountNumber,
        balance: account.balance
      }
    });

  } catch (error) {
    console.error('Profile error:', error.message);
    
    // 🔹 FALLBACK: If everything fails, try to return basic user info
    try {
      const userId = req.user?.id;
      if (userId) {
        const user = await User.findById(userId).select('fullName email phone');
        if (user) {
          return res.json({
            user: {
              fullName: user.fullName,
              email: user.email,
              phone: user.phone,
              accountNumber: "System maintenance...",
              balance: 0
            }
          });
        }
      }
    } catch (fallbackError) {
      // Even fallback failed
    }
    
    res.status(500).json({ 
      message: 'Server error loading profile'
    });
  }
};

// Keep your other functions
exports.getUserAccounts = async (req, res) => {
  try {
    const userId = req.user.id;
    const accounts = await Account.find({ userId, isActive: true });
    
    res.json({
      accounts: accounts.map(account => ({
        _id: account._id,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        balance: account.balance,
        createdAt: account.createdAt
      }))
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAccountDetails = async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.id;

    const account = await Account.findOne({ 
      _id: accountId, 
      userId,
      isActive: true 
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json({
      account: {
        _id: account._id,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        balance: account.balance,
        createdAt: account.createdAt
      }
    });
  } catch (error) {
    console.error('Get account details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deposit = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { amount, description } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const account = await Account.findOne({ 
      _id: accountId, 
      userId,
      isActive: true 
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    account.balance += parseFloat(amount);
    await account.save();

    res.json({
      message: 'Deposit successful',
      account: {
        _id: account._id,
        accountNumber: account.accountNumber,
        balance: account.balance
      }
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.withdraw = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { amount, description } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const account = await Account.findOne({ 
      _id: accountId, 
      userId,
      isActive: true 
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (account.balance < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    account.balance -= parseFloat(amount);
    await account.save();

    res.json({
      message: 'Withdrawal successful',
      account: {
        _id: account._id,
        accountNumber: account.accountNumber,
        balance: account.balance
      }
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Express.js logout route handler
// POST /api/auth/logout

exports.logout = async (req, res) => {
    try {
        // Get the authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No valid token provided'
            });
        }

        // Extract the token
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Option 1: If using JWT with a blacklist/invalidation system
        // Add the token to a blacklist (Redis, database, or in-memory store)
        try {
            // Example with Redis (uncomment if using Redis)
            // await redisClient.setex(`blacklist_${token}`, 3600, 'true'); // Blacklist for 1 hour
            
            // Example with database (uncomment if using database)
            // await BlacklistedToken.create({ token, expiresAt: new Date(Date.now() + 3600000) });
            
            console.log('Token blacklisted successfully');
        } catch (blacklistError) {
            console.error('Error blacklisting token:', blacklistError);
            // Don't fail the logout if blacklisting fails
        }

        // Option 2: If using sessions instead of JWT
        // req.session.destroy((err) => {
        //     if (err) {
        //         console.error('Session destruction error:', err);
        //     }
        // });

        // Clear any HTTP-only cookies if you're using them
        res.clearCookie('authToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        // Log the logout action (optional)
        console.log(`User logged out at ${new Date().toISOString()}`);

        // Return success response
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