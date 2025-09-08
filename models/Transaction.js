const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");



const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    default: () => `TXN-${uuidv4()}`
  },

  fromAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true
  },
  toAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account"
  },
  type: {
    type: String,
    required: true,
    enum: [
      "deposit",
      "withdrawal",
      "transfer",
      "payment",
      "fee",
      "interest",
      "refund",
      "check",
      "atm",
      "debit-card",
      "credit-card",
      "wire-transfer",
      "ach",
      "direct-deposit",
      "overdraft"
    ]
  },

  category: {
    type: String,
    enum: [
      "banking",
      "groceries",
      "gas",
      "restaurants",
      "shopping",
      "utilities",
      "healthcare",
      "education",
      "entertainment",
      "travel",
      "insurance",
      "loans",
      "investments",
      "other"
    ],
    default: "banking"
  },

  // Financial Information
  amount: {
    type: Number,
    required: true,
    validate: {
        validator: function(value) {
            return Math.abs(value) >= 0.01;
        },
        message: "Transaction amount must be at least $0.01 (absolute value)"
    }
},
  fee: {
    type: Number,
    default: 0,
    min: 0
  },

  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },

  description: {
    type: String,
    required: true,
    maxlength: [200, "Description cannot exceed 200 characters"]
  },
  reference: {
    type: String,
    maxlength: [50, "Reference cannot exceed 50 characters"]
  },

  status: {
    type: String,
    enum: ["pending", "completed", "failed", "cancelled", "reversed"],
    default: "pending"
  },

  channel: {
    type: String,
    enum: ["online", "atm", "branch", "phone", "mobile", "auto", "admin"],
    required: true
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
transactionSchema.index({ fromAccountId: 1, transactionDate: -1 });
transactionSchema.index({ toAccountId: 1, transactionDate: -1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ transactionDate: -1 });
transactionSchema.index({ effectiveDate: -1 });

// Method to get transaction summary
transactionSchema.methods.getSummary = function () {
  return {
    id: this._id,
    transactionId: this.transactionId,
    type: this.type,
    amount: this.amount,
    description: this.description,
    date: this.transactionDate,
    status: this.status,
    balanceAfter: this.balanceAfter
  };
};

// Static method to find transactions by account
transactionSchema.statics.findByAccountId = function (accountId, limit = 50, skip = 0) {
  return this.find({
    $or: [{ fromAccountId: accountId }, { toAccountId: accountId }]
  })
    .populate("fromAccountId", "accountNumber")
    .populate("toAccountId", "accountNumber")
    .sort({ transactionDate: -1 })
    .limit(limit)
    .skip(skip);
};

module.exports = mongoose.model("Transaction", transactionSchema);
