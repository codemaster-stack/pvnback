const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: function () {
        return this.role === "user";
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    
    // 🔹 ADD THESE MISSING FIELDS:
    accountNumber: {
      type: String,
      unique: true,
      // Don't set required: true here - we'll auto-generate it
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// 🔹 Auto-generate account number for new users
userSchema.pre("save", async function (next) {
  // Only generate account number for new users (not updates)
  if (this.isNew && !this.accountNumber) {
    let isUnique = false;
    let accountNumber;
    
    // Keep generating until we get a unique account number
    while (!isUnique) {
      // Generate a 10-digit account number
      accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      
      // Check if this account number already exists
      const existingUser = await this.constructor.findOne({ accountNumber });
      if (!existingUser) {
        isUnique = true;
      }
    }
    
    this.accountNumber = accountNumber;
  }
  next();
});

// 🔹 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔹 Auto-generate account number for new users
userSchema.pre("save", async function (next) {
  // Only generate account number for new users (not updates)
  if (this.isNew && !this.accountNumber) {
    let isUnique = false;
    let accountNumber;
    
    // Keep generating until we get a unique account number
    while (!isUnique) {
      // Generate a 10-digit account number
      accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      
      // Check if this account number already exists
      const existingUser = await this.constructor.findOne({ accountNumber });
      if (!existingUser) {
        isUnique = true;
      }
    }
    
    this.accountNumber = accountNumber;
  }
  next();
});

// 🔹 Compare entered password with stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);