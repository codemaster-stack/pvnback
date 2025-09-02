const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  // Card Identification
  cardNumber: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{16}$/, 'Card number must be 16 digits']
  },
  
  // Card Details
  cardType: {
    type: String,
    required: true,
    enum: ['debit', 'credit', 'prepaid']
  },
  
  cardBrand: {
    type: String,
    required: true,
    enum: ['visa', 'mastercard', 'american-express', 'discover']
  },
  
  // Account Association
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Card Holder Information
  cardholderName: {
    type: String,
    required: true,
    uppercase: true,
    maxlength: [26, 'Cardholder name cannot exceed 26 characters']
  },
  
  // Card Security
  cvv: {
    type: String,
    required: true,
    match: [/^\d{3,4}$/, 'CVV must be 3 or 4 digits'],
    select: false // Never include in queries
  },
  
  pin: {
    type: String,
    required: true,
    match: [/^\d{4}$/, 'PIN must be 4 digits'],
    select: false // Never include in queries
  },
  
  // Card Validity
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  
  // Card Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked', 'lost', 'stolen', 'expired', 'cancelled'],
    default: 'active'
  },
  
  // Card Limits
  dailyLimits: {
    withdrawal: {
      type: Number,
      default: 500,
      min: 0
    },
    purchase: {
      type: Number,
      default: 1000,
      min: 0
    },
    transfer: {
      type: Number,
      default: 1000,
      min: 0
    }
  },
  
  // Usage Tracking
  dailyUsage: {
    date: {
      type: Date,
      default: Date.now
    },
    withdrawalAmount: {
      type: Number,
      default: 0
    },
    purchaseAmount: {
      type: Number,
      default: 0
    },
    transferAmount: {
      type: Number,
      default: 0
    },
    transactionCount: {
      type: Number,
      default: 0
    }
  },
  
  // Card Features
  features: {
    contactless: {
      type: Boolean,
      default: true
    },
    international: {
      type: Boolean,
      default: false
    },
    online: {
      type: Boolean,
      default: true
    },
    atm: {
      type: Boolean,
      default: true
    }
  },
  
  // Card Valet Settings (from your frontend)
  valetSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    controls: {
      merchantTypes: [{
        type: String,
        enabled: Boolean
      }],
      spendingLimits: {
        daily: Number,
        monthly: Number
      },
      locationRestrictions: {
        domestic: {
          type: Boolean,
          default: true
        },
        international: {
          type: Boolean,
          default: false
        },
        allowedCountries: [String],
        blockedCountries: [String]
      },
      timeRestrictions: {
        enabled: Boolean,
        allowedHours: {
          start: String, // HH:MM format
          end: String    // HH:MM format
        },
        allowedDays: [String] // ['monday', 'tuesday', etc.]
      }
    },
    notifications: {
      transactions: {
        type: Boolean,
        default: true
      },
      declines: {
        type: Boolean,
        default: true
      },
      limits: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Security Events
  securityEvents: [{
    type: {
      type: String,
      enum: ['blocked', 'unblocked', 'lost-reported', 'stolen-reported', 'pin-changed', 'fraud-alert']
    },
    date: {
      type: Date,
      default: Date.now
    },
    reason: String,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    ipAddress: String,
    location: String
  }],
  
  // Last Usage Information
  lastUsed: {
    date: Date,
    location: String,
    amount: Number,
    merchant: String
  },
  
  // Replacement Information
  replacementCard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card'
  },
  replacedCard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card'
  },
  replacementReason: {
    type: String,
    enum: ['lost', 'stolen', 'damaged', 'expired', 'compromised']
  },
  
  // Delivery Information
  delivery: {
    method: {
      type: String,
      enum: ['standard-mail', 'express-mail', 'branch-pickup'],
      default: 'standard-mail'
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    },
    trackingNumber: String,
    deliveredDate: Date
  },
  
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
cardSchema.index({ cardNumber: 1 });
cardSchema.index({ accountId: 1 });
cardSchema.index({ userId: 1 });
cardSchema.index({ status: 1 });
cardSchema.index({ expiryDate: 1 });
cardSchema.index({ 'dailyUsage.date': 1 });

// Pre-save middleware to generate card number and set expiry
cardSchema.pre('save', function(next) {
  if (!this.cardNumber) {
    // Generate card number (using test BIN for demo)
    const bin = process.env.CARD_BIN || '424242';
    const accountIdentifier = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const checkDigit = '0'; // In real implementation, calculate Luhn check digit
    this.cardNumber = bin + accountIdentifier + checkDigit;
  }
  
  if (!this.expiryDate) {
    // Set expiry to 4 years from issue date
    const expiryDate = new Date(this.issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 4);
    this.expiryDate = expiryDate;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Virtual for masked card number
cardSchema.virtual('maskedCardNumber').get(function() {
  if (!this.cardNumber) return '';
  return '**** **** **** ' + this.cardNumber.slice(-4);
});

// Virtual for expiry month/year
cardSchema.virtual('expiryMonthYear').get(function() {
  if (!this.expiryDate) return '';
  const month = (this.expiryDate.getMonth() + 1).toString().padStart(2, '0');
  const year = this.expiryDate.getFullYear().toString().slice(-2);
  return `${month}/${year}`;
});

// Virtual for checking if card is expired
cardSchema.virtual('isExpired').get(function() {
  return this.expiryDate < new Date();
});

// Method to check if card can be used
cardSchema.methods.canBeUsed = function() {
  if (this.status !== 'active') {
    return { allowed: false, reason: `Card is ${this.status}` };
  }
  
  if (this.isExpired) {
    return { allowed: false, reason: 'Card is expired' };
  }
  
  return { allowed: true };
};

// Method to check daily limits
cardSchema.methods.checkDailyLimit = function(amount, type = 'purchase') {
  const today = new Date().toDateString();
  const usageDate = this.dailyUsage.date ? this.dailyUsage.date.toDateString() : null;
  
  // Reset daily usage if it's a new day
  if (usageDate !== today) {
    this.dailyUsage = {
      date: new Date(),
      withdrawalAmount: 0,
      purchaseAmount: 0,
      transferAmount: 0,
      transactionCount: 0
    };
  }
  
  const currentUsage = this.dailyUsage[`${type}Amount`] || 0;
  const limit = this.dailyLimits[type] || 0;
  
  if (currentUsage + amount > limit) {
    return {
      allowed: false,
      reason: `Daily ${type} limit exceeded`,
      remaining: limit - currentUsage
    };
  }
  
  return { allowed: true, remaining: limit - (currentUsage + amount) };
};

// Method to record usage
cardSchema.methods.recordUsage = function(amount, type = 'purchase') {
  const today = new Date().toDateString();
  const usageDate = this.dailyUsage.date ? this.dailyUsage.date.toDateString() : null;
  
  // Reset daily usage if it's a new day
  if (usageDate !== today) {
    this.dailyUsage = {
      date: new Date(),
      withdrawalAmount: 0,
      purchaseAmount: 0,
      transferAmount: 0,
      transactionCount: 0
    };
  }
  
  this.dailyUsage[`${type}Amount`] += amount;
  this.dailyUsage.transactionCount += 1;
  
  // Update last used information
  this.lastUsed = {
    date: new Date(),
    amount: amount
  };
  
  return this.save();
};

// Method to block card
cardSchema.methods.blockCard = function(reason, reportedBy, ipAddress = null) {
  this.status = 'blocked';
  this.securityEvents.push({
    type: 'blocked',
    reason: reason,
    reportedBy: reportedBy,
    ipAddress: ipAddress,
    date: new Date()
  });
  
  return this.save();
};

// Method to format card for display (security safe)
cardSchema.methods.toSafeFormat = function() {
  return {
    id: this._id,
    maskedCardNumber: this.maskedCardNumber,
    cardType: this.cardType,
    cardBrand: this.cardBrand,
    cardholderName: this.cardholderName,
    expiryMonthYear: this.expiryMonthYear,
    status: this.status,
    features: this.features,
    dailyLimits: this.dailyLimits,
    lastUsed: this.lastUsed,
    isExpired: this.isExpired
  };
};

// Static method to find cards by user
cardSchema.statics.findByUserId = function(userId) {
  return this.find({ userId, status: { $nin: ['cancelled'] } })
    .populate('accountId', 'accountNumber accountName accountType')
    .sort({ createdAt: -1 });
};

// Static method to find active cards
cardSchema.statics.findActiveCards = function(userId) {
  return this.find({ 
    userId, 
    status: 'active',
    expiryDate: { $gt: new Date() }
  });
};

module.exports = mongoose.model('Card', cardSchema);