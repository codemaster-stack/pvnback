// backend/models/SupportMessage.js
const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  sender: { type: String, enum: ['user','admin'], required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const SupportMessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // if registered
  name: { type: String, default: '' },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  subject: { type: String, default: '' },
  message: { type: String, required: true },
  replies: [ReplySchema],
  status: { type: String, enum: ['open','closed'], default: 'open' },
  isReadByAdmin: { type: Boolean, default: false },
  isReadByUser: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SupportMessage', SupportMessageSchema);
