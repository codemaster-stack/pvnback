// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   // Personal Information
//   fullName: {
//     type: String,
//     required: [true, 'Full name is required'],
//     trim: true,
//     maxlength: [100, 'Full name cannot exceed 100 characters']
//   },
//   email: {
//     type: String,
//     required: [true, 'Email is required'],
//     unique: true,
//     lowercase: true,
//     trim: true,
//     match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
//   },
//   phone: {
//     type: String,
//     required: [true, 'Phone number is required'],
//     match: [/^\+?[\d\s\-\(\)]{10,}$/, 'Please enter a valid phone number']
//   },
//   dateOfBirth: {
//     type: Date,
//     required: [true, 'Date of birth is required']
//   },
//   ssn: {
//     type: String,
//     required: [true, 'SSN is required'],
//     unique: true,
//     match: [/^\d{3}-\d{2}-\d{4}$/, 'Please enter a valid SSN (XXX-XX-XXXX)']
//   },
  
//   // Address Information
//   address: {
//     street: {
//       type: String,
//       required: [true, 'Street address is required'],
//       maxlength: [200, 'Street address cannot exceed 200 characters']
//     },
//     city: {
//       type: String,
//       required: [true, 'City is required'],
//       maxlength: [100, 'City cannot exceed 100 characters']
//     },
//     state: {
//       type: String,
//       required: [true, 'State is required'],
//       maxlength: [50, 'State cannot exceed 50 characters']
//     },
//     zipCode: {
//       type: String,
//       required: [true, 'ZIP code is required'],
//       match: [/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code']
//     }
//   },
  
//   // Authentication
//   password: {
//     type: String,
//     required: [true, 'Password is required'],
//     minlength: [8, 'Password must be at least 8 characters long'],
//     select: false // Don't include password in queries by default
//   },
//   passwordResetToken: String,
//   passwordResetExpires: Date,
  
//   // Account Security
//   isEmailVerified: {
//     type: Boolean,
//     default: false
//   },
//   emailVerificationToken: String,
//   loginAttempts: {
//     type: Number,
//     default: 0
//   },
//   lockUntil: Date,
  
//   // Account Status
//   accountStatus: {
//     type: String,
//     enum: ['active', 'inactive', 'suspended', 'closed'],
//     default: 'active'
//   },
//   role: {
//     type: String,
//     enum: ['customer', 'admin', 'manager', 'teller'],
//     default: 'customer'
//   },
  
//   // Banking Information
//   customerNumber: {
//     type: String,
//     unique: true,
//     required: true
//   },
//   accountOpenDate: {
//     type: Date,
//     default: Date.now
//   },
//   lastLogin: Date,
  
//   // Preferences
//   preferences: {
//     notifications: {
//       email: {
//         type: Boolean,
//         default: true
//       },
//       sms: {
//         type: Boolean,
//         default: false
//       },
//       push: {
//         type: Boolean,
//         default: true
//       }
//     },
//     language: {
//       type: String,
//       default: 'en'
//     },
//     timezone: {
//       type: String,
//       default: 'America/Chicago'
//     }
//   },
  
//   // Metadata
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // Indexes
// userSchema.index({ email: 1 });
// userSchema.index({ customerNumber: 1 });
// userSchema.index({ ssn: 1 });
// userSchema.index({ accountStatus: 1 });

// // Virtual for account lockout
// userSchema.virtual('isLocked').get(function() {
//   return !!(this.lockUntil && this.lockUntil > Date.now());
// });

// // Pre-save middleware to hash password
// userSchema.pre('save', async function(next) {
//   // Only hash password if it's modified or new
//   if (!this.isModified('password')) return next();
  
//   try {
//     const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
//     this.password = await bcrypt.hash(this.password, saltRounds);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Pre-save middleware to generate customer number
// userSchema.pre('save', function(next) {
//   if (!this.customerNumber) {
//     // Generate customer number: PVNB + timestamp + random
//     const timestamp = Date.now().toString().slice(-6);
//     const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
//     this.customerNumber = `PVNB${timestamp}${random}`;
//   }
  
//   this.updatedAt = Date.now();
//   next();
// });

// // Method to compare password
// userSchema.methods.comparePassword = async function(candidatePassword) {
//   try {
//     return await bcrypt.compare(candidatePassword, this.password);
//   } catch (error) {
//     throw new Error('Password comparison failed');
//   }
// };

// // Method to handle login attempts
// userSchema.methods.incLoginAttempts = function() {
//   // If we have a previous lock that has expired, restart at 1
//   if (this.lockUntil && this.lockUntil < Date.now()) {
//     return this.updateOne({
//       $unset: {
//         lockUntil: 1
//       },
//       $set: {
//         loginAttempts: 1
//       }
//     });
//   }
  
//   const updates = { $inc: { loginAttempts: 1 } };
//   const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
//   const lockTime = parseInt(process.env.ACCOUNT_LOCKOUT_TIME) || 30; // minutes
  
//   // Lock account after max attempts
//   if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
//     updates.$set = {
//       lockUntil: Date.now() + (lockTime * 60 * 1000)
//     };
//   }
  
//   return this.updateOne(updates);
// };

// // Method to reset login attempts
// userSchema.methods.resetLoginAttempts = function() {
//   return this.updateOne({
//     $unset: {
//       loginAttempts: 1,
//       lockUntil: 1
//     }
//   });
// };

// // Method to generate password reset token
// userSchema.methods.createPasswordResetToken = function() {
//   const crypto = require('crypto');
//   const resetToken = crypto.randomBytes(32).toString('hex');
  
//   this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
//   this.passwordResetExpires = Date.now() + (parseInt(process.env.PASSWORD_RESET_EXPIRE) || 10) * 60 * 1000;
  
//   return resetToken;
// };

// // Method to sanitize user data for response
// userSchema.methods.toJSON = function() {
//   const user = this.toObject();
  
//   // Remove sensitive fields
//   delete user.password;
//   delete user.passwordResetToken;
//   delete user.passwordResetExpires;
//   delete user.emailVerificationToken;
//   delete user.ssn; // Mask or remove SSN in responses
//   delete user.loginAttempts;
//   delete user.lockUntil;
  
//   return user;
// };

// // Static method to find by email
// userSchema.statics.findByEmail = function(email) {
//   return this.findOne({ email: email.toLowerCase() });
// };

// // Static method to find by customer number
// userSchema.statics.findByCustomerNumber = function(customerNumber) {
//   return this.findOne({ customerNumber });
// };

// module.exports = mongoose.model('User', userSchema);





// models/userModel.js
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
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,

  },
  { timestamps: true }
  
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);



