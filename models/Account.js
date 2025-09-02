const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  // Account Identification
  accountNumber: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{10,12}$/, 'Account number must be 10-12 digits']
  },
  routingNumber: {
    type: String,
    required: true,
    default: process.env.BANK_ROUTING_NUMBER || '103101987'
  },
  
  // Account Owner
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Account Details
  accountType: {
    type: String,
    required: true,
    enum: [
      'checking',
      'savings',
      'money-market',
      'cd', // Certificate of Deposit
      'ira',
      'business-checking',
      'business-savings'
    ]
  },
  accountSubtype: {
    type: String,
    enum: [
      'basic-checking',
      'premium-checking',
      'student-checking',
      'senior-checking',
      'regular-savings',
      'high-yield-savings',
      'traditional-ira',
      'roth-ira'
    ]
  },
  accountName: {
    type: String,
    required: true,
    maxlength: [100, 'Account name cannot exceed 100 characters']
  },
  
  // Financial Information
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Balance cannot be negative for most account types']
  },
  availableBalance: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Account Limits and Features
  overdraftProtection: {
    enabled: {
      type: Boolean,
      default: false
    },
    limit: {
      type: Number,
      default: 0,
      min: 0
    },
    linkedAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account'
    }
  },
  
  dailyLimits: {
    withdrawal: {
      type: Number,
      default: 500
    },
    transfer: {
      type: Number,
      default: 2500
    },
    purchase: {
      type: Number,
      default: 1000
    }
  },
  
  // Interest Information (for savings, CDs, etc.)
  interestRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  interestEarned: {
    type: Number,
    default: 0
  },
  lastInterestCalculation: Date,
  
  // CD Specific Information
  cdDetails: {
    term: {
      type: Number, // in months
      min: 1
    },
    maturityDate: Date,
    penaltyRate: {
      type: Number,
      default: 0
    },
    autoRenewal: {
      type: Boolean,
      default: false
    }
  },
  
  // Account Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'frozen', 'closed'],
    default: 'active'
  },
  
  // Account Flags
  flags: {
    isMinor: {
      type: Boolean,
      default: false
    },
    requiresDualApproval: {
      type: Boolean,
      default: false
    },
    isJoint: {
      type: Boolean,
      default: false
    },
    isBusiness: {
      type: Boolean,
      default: false
    }
  },
  
  // Joint Account Holders (if applicable)
  jointHolders: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    relationship: {
      type: String,
      enum: ['spouse', 'parent', 'child', 'business-partner', 'other']
    },
    permissions: {
      view: {
        type: Boolean,
        default: true
      },
      withdraw: {
        type: Boolean,
        default: true
      },
      transfer: {
        type: Boolean,
        default: true
      }
    }
  }],
  
  // Account Opening Information
  openingDeposit: {
    type: Number,
    required: true,
    min: [0, 'Opening deposit cannot be negative']
  },
  openedDate: {
    type: Date,
    default: Date.now
  },
  openedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Staff member who opened the account
  },
  
  // Maintenance and Fees
  monthlyFee: {
    type: Number,
    default: 0,
    min: 0
  },
  minimumBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  lastMaintenanceFeeDate: Date,
  
  // Statements
  statementCycle: {
    type: String,
    enum: ['monthly', 'quarterly'],
    default: 'monthly'
  },
  lastStatementDate: Date,
  paperlessStatements: {
    type: Boolean,
    default: true
  },
  
  // Notifications
  lowBalanceAlert: {
    enabled: {
      type: Boolean,
      default: true
    },
    threshold: {
      type: Number,
      default: 100
    }
  },
  
  // Metadata
  notes: [{
    date: {
      type: Date,
      default: Date.now
    },
    content: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
accountSchema.index({ accountNumber: 1 });
accountSchema.index({ userId: 1 });
accountSchema.index({ status: 1 });
accountSchema.index({ accountType: 1 });
accountSchema.index({ createdAt: -1 });

// Pre-save middleware to generate account number
accountSchema.pre('save', function(next) {
  if (!this.accountNumber) {
    // Generate account number: 10-12 digits
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.accountNumber = (timestamp.slice(-7) + random).padStart(10, '0');
  }
  
  this.updatedAt = Date.now();
  next();
});

// Pre-save middleware to update available balance
accountSchema.pre('save', function(next) {
  // Calculate available balance considering holds, overdraft, etc.
  this.availableBalance = this.balance;
  
  // If overdraft protection is enabled, add overdraft limit
  if (this.overdraftProtection.enabled) {
    this.availableBalance += this.overdraftProtection.limit;
  }
  
  next();
});

// Virtual for masked account number
accountSchema.virtual('maskedAccountNumber').get(function() {
  if (!this.accountNumber) return '';
  const length = this.accountNumber.length;
  return '*'.repeat(length - 4) + this.accountNumber.slice(-4);
});

// Method to check if transaction is allowed
accountSchema.methods.canPerformTransaction = function(amount, type = 'debit') {
  if (this.status !== 'active') {
    return { allowed: false, reason: 'Account is not active' };
  }
  
  if (type === 'debit') {
    if (amount > this.availableBalance) {
      return { allowed: false, reason: 'Insufficient funds' };
    }
    
    // Check daily limits
    const today = new Date().toDateString();
    // This would need to be implemented with transaction tracking
    // For now, we'll just check basic balance
  }
  
  return { allowed: true };
};

// Method to calculate interest (for savings accounts)
accountSchema.methods.calculateInterest = function() {
  if (this.accountType === 'savings' || this.accountType === 'cd') {
    const dailyRate = (this.interestRate / 100) / 365;
    const daysSinceLastCalculation = this.lastInterestCalculation 
      ? Math.floor((Date.now() - this.lastInterestCalculation) / (1000 * 60 * 60 * 24))
      : 0;
    
    const interestEarned = this.balance * dailyRate * daysSinceLastCalculation;
    return interestEarned;
  }
  
  return 0;
};

// Method to check if account requires minimum balance
accountSchema.methods.meetsMinimumBalance = function() {
  return this.balance >= this.minimumBalance;
};

// Method to format account for display
accountSchema.methods.toDisplayFormat = function() {
  return {
    id: this._id,
    accountNumber: this.maskedAccountNumber,
    accountName: this.accountName,
    accountType: this.accountType,
    balance: this.balance,
    availableBalance: this.availableBalance,
    status: this.status,
    interestRate: this.interestRate,
    lastTransaction: this.updatedAt
  };
};

// Static method to find accounts by user
accountSchema.statics.findByUserId = function(userId) {
  return this.find({ userId, status: { $ne: 'closed' } })
    .populate('userId', 'fullName email')
    .sort({ createdAt: -1 });
};

// Static method to find account by account number
accountSchema.statics.findByAccountNumber = function(accountNumber) {
  return this.findOne({ accountNumber, status: { $ne: 'closed' } });
};

module.exports = mongoose.model('Account', accountSchema);