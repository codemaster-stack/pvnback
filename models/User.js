const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  savingsAccountNumber: { type: String, unique: true },
  currentAccountNumber: { type: String, unique: true },
  photo: { type: String, default: "" },

  balances: {
    savings: { type: Number, default: 0 },
    current: { type: Number, default: 0 },
    loan: { type: Number, default: 0 },
    inflow: { type: Number, default: 0 },
    outflow: { type: Number, default: 0 },
  },

  transactionPin: {
    type: String, // will store hashed PIN
    select: false // don’t return it by default in queries
  },

  resetToken: String,
  resetTokenExpiry: Date,
});

// 🔑 Hash password & transaction PIN before save
userSchema.pre("save", async function (next) {
  // Hash password
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  // Hash transaction PIN
  if (this.isModified("transactionPin")) {
    this.transactionPin = await bcrypt.hash(this.transactionPin, 10);
  }

  next();
});

// 🔑 Compare PIN
userSchema.methods.matchPin = async function (enteredPin) {
  return await bcrypt.compare(enteredPin, this.transactionPin);
};

module.exports = mongoose.model("User", userSchema);
