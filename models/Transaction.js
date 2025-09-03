const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true
  },
  fromAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  toAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },
  type: {
    type: String,
    required: true,
    enum: ['deposit','withdrawal','transfer','payment','fee','interest','refund','check','atm','debit-card','credit-card','wire-transfer','ach','direct-deposit','overdraft']
  },
  
  category: {
    type: String,
    enum: [
      'banking',
      'groceries',
      'gas',
      'restaurants',
      'shopping',
      'utilities',
      'healthcare',
      'education',
      'entertainment',
      'travel',
      'insurance',
      'loans',
      'investments',
      'other'
    ],
    default: 'banking'
  },
  
  // Financial Information
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Transaction amount must be at least $0.01']
  },
  
  fee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Balances (for record keeping)
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  
  // Transaction Description
  description: {
    type: String,
    required: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  reference: {
    type: String,
    maxlength: [50, 'Reference cannot exceed 50 characters']
  },
  
  // Transaction Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'reversed'],
    default: 'pending'
  },
  
  // Transaction Method/Channel
  channel: {
    type: String,
    enum: ['online', 'atm', 'branch', 'phone', 'mobile', 'auto'],
    required: true
  },
  
  // Location Information (for ATM, branch transactions)
  location: {
    name: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // External Transaction Information
  externalTransactionId: String,
  checkNumber: String,
  merchantName: String,
  merchantCategory: String,
  
  // Wire Transfer Details
  wireDetails: {
    bankName: String,
    bankRoutingNumber: String,
    bankAddress: String,
    recipientName: String,
    recipientAddress: String,
    wireReference: String,
    fees: {
      ourFee: Number,
      correspondentFee: Number,
      beneficiaryFee: Number
    }
  },
  
  // ACH Details
  achDetails: {
    companyName: String,
    companyId: String,
    batchNumber: String,
    traceNumber: String
  },
  
  // Card Transaction Details
  cardDetails: {
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card'
    },
    maskedCardNumber: String,
    authorizationCode: String,
    merchantId: String,
    terminalId: String,
    isContactless: Boolean,
    cvvVerified: Boolean
  },
  
  // Recurring Transaction Information
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually']
    },
    nextDueDate: Date,
    endDate: Date,
    parentTransactionId: String
  },
  
  // Transaction Timing
  transactionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  effectiveDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  processedDate: Date,
  
  // Security and Compliance
  ipAddress: String,
  userAgent: String,
  deviceId: String,
  fraudScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isReviewed: {
    type: Boolean,
    default: false
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: String,
  
  // Metadata
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
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ fromAccountId: 1, transactionDate: -1 });
transactionSchema.index({ toAccountId: 1, transactionDate: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ transactionDate: -1 });
transactionSchema.index({ effectiveDate: -1 });
transactionSchema.index({ 'recurring.isRecurring': 1, 'recurring.nextDueDate': 1 });

// Pre-save middleware to generate transaction ID
transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.transactionId = `TXN${timestamp}${random}`;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Virtual for transaction age in days
transactionSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.transactionDate) / (1000 * 60 * 60 * 24));
});

// Method to format amount for display
transactionSchema.methods.getFormattedAmount = function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(this.amount);
};

// Method to check if transaction can be reversed
transactionSchema.methods.canBeReversed = function() {
  const reversibleTypes = ['transfer', 'payment', 'fee'];
  const maxReversalDays = 3;
  
  return (
    reversibleTypes.includes(this.type) &&
    this.status === 'completed' &&
    this.ageInDays <= maxReversalDays
  );
};

// Method to get transaction summary
transactionSchema.methods.getSummary = function() {
  return {
    id: this._id,
    transactionId: this.transactionId,
    type: this.type,
    amount: this.getFormattedAmount(),
    description: this.description,
    date: this.transactionDate,
    status: this.status,
    balanceAfter: this.balanceAfter
  };
};

// Static method to find transactions by account
transactionSchema.statics.findByAccountId = function(accountId, limit = 50, skip = 0) {
  return this.find({
    $or: [
      { fromAccountId: accountId },
      { toAccountId: accountId }
    ]
  })
  .populate('fromAccountId', 'accountNumber accountName')
  .populate('toAccountId', 'accountNumber accountName')
  .sort({ transactionDate: -1 })
  .limit(limit)
  .skip(skip);
};

// Static method to get transaction summary by date range
transactionSchema.statics.getTransactionSummary = function(accountId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { fromAccountId: mongoose.Types.ObjectId(accountId) },
          { toAccountId: mongoose.Types.ObjectId(accountId) }
        ],
        transactionDate: {
          $gte: startDate,
          $lte: endDate
        },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { totalAmount: -1 }
    }
  ]);
};

// Static method to find pending transactions
transactionSchema.statics.findPendingTransactions = function(accountId) {
  return this.find({
    $or: [
      { fromAccountId: accountId },
      { toAccountId: accountId }
    ],
    status: 'pending'
  }).sort({ transactionDate: -1 });
};

module.exports = mongoose.model('Transaction', transactionSchema);