// models/ContactMessage.js
const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  subject: { type: String, required: true },
  message: { type: String, required: true },

  status: { type: String, enum: ['unread', 'read', 'replied'], default: 'unread' },

  replies: [
    {
      senderRole: { type: String, enum: ['user', 'admin'], required: true },
      message: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-update updatedAt
contactMessageSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
