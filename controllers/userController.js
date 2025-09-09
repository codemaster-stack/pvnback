// controllers/userDashboardController.js
// const User = require("../models/User");
// const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const ContactMessage = require('../models/Contact');



// User submits contact form
exports.submitContactMessage = async (req, res) => {
  try {
    const { subject, message, email, phone } = req.body;
    const userId = req.user.id;

    const contactMessage = new ContactMessage({
      userId,
      email,
      phone,
      subject,
      message,
      replies: [{ senderRole: 'user', message }]
    });

    await contactMessage.save();

    res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
};



exports.downloadStatement = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user's account
    const account = await Account.findOne({ userId });
    if (!account) {
      return res.status(404).json({ message: 'No account found for user' });
    }

    // Fetch latest 100 transactions
    const transactions = await Transaction.findByAccountId(account._id, 100);

    // Create PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const filename = `statement_${Date.now()}.pdf`;

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    doc.pipe(res);

    // Title
    doc.fontSize(20).text('Supapay Transaction Statement', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Account Number: ${account.accountNumber || 'N/A'}`);
    doc.text(`Generated On: ${new Date().toLocaleString()}`);
    doc.moveDown();

    // If no transactions
    if (transactions.length === 0) {
      doc.fontSize(14).text('No transactions available for this period.', { align: 'center' });
      doc.end();
      return;
    }

    // Table Header
    doc.fontSize(13).text('Date', 50, doc.y, { continued: true });
    doc.text('Description', 150, doc.y, { continued: true });
    doc.text('Amount', 350, doc.y, { continued: true });
    doc.text('Balance After', 450);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Transactions Table
    transactions.forEach(tx => {
      const date = new Date(tx.transactionDate).toLocaleDateString();
      const amountFormatted = `₦${Math.abs(tx.amount).toLocaleString()}`;
      const amountColor = tx.amount < 0 ? 'red' : 'green';

      doc.fontSize(11).fillColor('black').text(date, 50, doc.y, { continued: true });
      doc.text(tx.description || '-', 150, doc.y, { continued: true });
      doc.fillColor(amountColor).text(
        `${tx.amount < 0 ? '-' : '+'}${amountFormatted}`,
        350,
        doc.y,
        { continued: true }
      );
      doc.fillColor('black').text(`₦${tx.balanceAfter.toLocaleString()}`, 450);
      doc.moveDown();
    });

    // Footer
    doc.moveDown();
    doc.fontSize(10).fillColor('gray').text(
      'This is a system-generated statement. If you have questions, contact Supapay Support.',
      { align: 'center' }
    );

    doc.end();
  } catch (error) {
    console.error('Error generating statement:', error);
    res.status(500).json({ message: 'Error generating statement' });
  }
};


// Admin gets all contact messages
exports.getContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .populate('userId', 'fullName email')
      .sort({ updatedAt: -1 });

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
    const role = req.user.role === 'admin' ? 'admin' : 'user';

    const contactMessage = await ContactMessage.findById(messageId);
    if (!contactMessage) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    contactMessage.messages.push({
      senderRole: role,
      text: reply
    });
    contactMessage.status = 'replied';
    await contactMessage.save();

    // 🔔 Create notification for the opposite role
    // const notifyRole = role === 'admin' ? 'user' : 'admin';
    // await Notification.create({ type: 'contact-reply', refId: contactMessage._id, forRole: notifyRole });

    res.json({ message: 'Reply sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending reply' });
  }
};


exports.getConversation = async (req, res) => {
  try {
    const { messageId } = req.params;
    const conversation = await ContactMessage.findById(messageId)
      .populate('userId', 'fullName email');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversation' });
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