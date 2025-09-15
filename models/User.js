// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const transactionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  description: String,
  amount: Number,
  type: { type: String, enum: ["inflow", "outflow"] },
  status: { type: String, default: "completed" },
  balance: Number
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    // balances
    balances: {
      current: { type: Number, default: 0 },
      savings: { type: Number, default: 0 },
      loan: { type: Number, default: 0 }
    },

    // transactions
    transactions: [transactionSchema],

    transactionPin: { type: String, default: null },


    // login tracking
    lastLoginIp: { type: String },
    lastLoginDate: { type: Date },

    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
