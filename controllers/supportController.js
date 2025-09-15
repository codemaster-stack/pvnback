// backend/controllers/supportController.js
const SupportMessage = require('../models/SupportMessage');
const sendEmail = require('../utils/sendEmail'); // your existing email util (adjust path)
const User = require('../models/User'); // optional for population

// Public: create a new support message (registered or guest)
exports.createMessage = async (req, res) => {
  try {
    const { userId, name, email, phone, subject, message } = req.body;

    if (!email || !message) return res.status(400).json({ message: 'Email and message are required' });

    const doc = await SupportMessage.create({
      userId: userId || null,
      name: name || '',
      email,
      phone: phone || '',
      subject: subject || '',
      message
    });

    // Optional: notify admin by email (light) — you can disable if you prefer
    try {
      await sendEmail({
        to: process.env.SUPPORT_ADMIN_EMAIL || process.env.EMAIL_USER,
        subject: `New support message: ${subject || 'No subject'}`,
        text: `New message from ${email}\n\n${message}\n\nID: ${doc._id}`
      });
    } catch (e) {
      console.warn('Failed to send admin email notification (non-fatal):', e.message);
    }

    res.status(201).json({ message: 'Message received', data: doc });
  } catch (error) {
    console.error('createMessage error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: list messages (paginated)
exports.getAllMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);

    const query = {}; // add filters later: status, unread, etc.
    const total = await SupportMessage.countDocuments(query);
    const docs = await SupportMessage.find(query)
      .sort({ createdAt: -1 })
      .skip((page-1)*limit)
      .limit(limit)
      .lean();

    // count unread for badge
    const unreadCount = await SupportMessage.countDocuments({ isReadByAdmin: false });

    res.json({ total, page, limit, unreadCount, data: docs });
  } catch (error) {
    console.error('getAllMessages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: get single message
exports.getMessageById = async (req, res) => {
  try {
    const doc = await SupportMessage.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: 'Message not found' });
    res.json(doc);
  } catch (error) {
    console.error('getMessageById error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: reply to message
exports.replyToMessage = async (req, res) => {
  try {
    const { id } = req.params; // message id
    const { message } = req.body; // admin reply text

    if (!message) return res.status(400).json({ message: 'Reply is required' });

    const doc = await SupportMessage.findById(id);
    if (!doc) return res.status(404).json({ message: 'Message not found' });

    // append reply
    doc.replies.push({ sender: 'admin', message });
    doc.isReadByUser = false;   // user has new reply
    doc.isReadByAdmin = true;   // admin read/responded
    await doc.save();

    // send the reply via email to the user (optional but recommended)
    try {
      await sendEmail({
        to: doc.email,
        subject: `Re: ${doc.subject || 'Support message'}`,
        text: `Hello ${doc.name || ''},\n\n${message}\n\n--\nPauls Valley National Bank`
      });
    } catch (e) {
      console.warn('Failed to send email to user on reply (non-fatal):', e.message);
    }

    res.json({ message: 'Reply sent', data: doc });
  } catch (error) {
    console.error('replyToMessage error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Registered user: get messages for logged-in user
exports.getUserMessages = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const docs = await SupportMessage.find({ userId }).sort({ createdAt: -1 }).lean();
    res.json({ data: docs });
  } catch (error) {
    console.error('getUserMessages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Public: get messages by email for non-registered user notifications
exports.getMessagesByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const docs = await SupportMessage.find({ email }).sort({ createdAt: -1 }).lean();
    res.json({ data: docs });
  } catch (error) {
    console.error('getMessagesByEmail error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin mark message read
exports.markReadAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await SupportMessage.findById(id);
    if (!doc) return res.status(404).json({ message: 'Message not found' });
    doc.isReadByAdmin = true;
    await doc.save();
    res.json({ message: 'Marked read' });
  } catch (error) {
    console.error('markReadAdmin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
