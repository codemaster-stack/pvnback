const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  // Contact Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]{10,}$/, 'Please enter a valid phone number']
  },
  
  // Message Details
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  
  // Inquiry Type
  inquiryType: {
    type: String,
    required: true,
    enum: [
      'general',
      'account-support',
      'loan-inquiry',
      'card-issue',
      'online-banking',
      'complaint',
      'suggestion',
      'business-inquiry',
      'investment',
      'mortgage'
    ],
    default: 'general'
  },
  
  // Priority Level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['new', 'assigned', 'in-progress', 'waiting-response', 'resolved', 'closed'],
    default: 'new'
  },
  
  // Assignment Information
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDate: Date,
  
  // Customer Information (if existing customer)
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  customerNumber: String,
  
  // Response Tracking
  responses: [{
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    responseDate: {
      type: Date,
      default: Date.now
    },
    message: {
      type: String,
      required: true,
      maxlength: [2000, 'Response cannot exceed 2000 characters']
    },
    method: {
      type: String,
      enum: ['email', 'phone', 'in-person', 'system'],
      default: 'email'
    }
  }],
  
  // Resolution Information
  resolution: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedDate: Date,
    resolutionSummary: {
      type: String,
      maxlength: [1000, 'Resolution summary cannot exceed 1000 characters']
    },
    customerSatisfaction: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Technical Information
  source: {
    type: String,
    enum: ['website', 'mobile-app', 'phone', 'email', 'branch', 'chat'],
    default: 'website'
  },
  ipAddress: String,
  userAgent: String,
  referrer: String,
  
  // Service Level Agreement
  sla: {
    responseTime: {
      type: Number, // in hours
      default: 24
    },
    resolutionTime: {
      type: Number, // in hours
      default: 72
    },
    isOverdue: {
      type: Boolean,
      default: false
    }
  },
  
  // Follow-up Information
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    scheduledDate: Date,
    completedDate: Date,
    notes: String
  },
  
  // Tags and Categories
  tags: [String],
  
  // Internal Notes
  internalNotes: [{
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      maxlength: [1000, 'Internal note cannot exceed 1000 characters']
    }
  }],
  
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
contactSchema.index({ email: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ inquiryType: 1 });
contactSchema.index({ priority: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ assignedTo: 1 });
contactSchema.index({ customerId: 1 });

// Pre-save middleware
contactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Check if SLA is overdue
  const hoursOld = (Date.now() - this.createdAt) / (1000 * 60 * 60);
  
  if (this.status === 'new' && hoursOld > this.sla.responseTime) {
    this.sla.isOverdue = true;
  } else if (['assigned', 'in-progress'].includes(this.status) && hoursOld > this.sla.resolutionTime) {
    this.sla.isOverdue = true;
  }
  
  next();
});

// Virtual for age in hours
contactSchema.virtual('ageInHours').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

// Method to assign to staff member
contactSchema.methods.assignTo = function(staffUserId) {
  this.assignedTo = staffUserId;
  this.assignedDate = new Date();
  this.status = 'assigned';
  return this.save();
};

// Method to add response
contactSchema.methods.addResponse = function(respondedBy, message, method = 'email') {
  this.responses.push({
    respondedBy,
    message,
    method,
    responseDate: new Date()
  });
  
  if (this.status === 'new' || this.status === 'assigned') {
    this.status = 'in-progress';
  }
  
  return this.save();
};

// Method to resolve inquiry
contactSchema.methods.resolve = function(resolvedBy, resolutionSummary) {
  this.resolution = {
    resolvedBy,
    resolvedDate: new Date(),
    resolutionSummary
  };
  this.status = 'resolved';
  return this.save();
};

// Method to add internal note
contactSchema.methods.addInternalNote = function(addedBy, note) {
  this.internalNotes.push({
    addedBy,
    note,
    date: new Date()
  });
  return this.save();
};

// Static method to find by inquiry type
contactSchema.statics.findByInquiryType = function(inquiryType) {
  return this.find({ inquiryType })
    .populate('assignedTo', 'fullName email')
    .populate('customerId', 'fullName customerNumber')
    .sort({ createdAt: -1 });
};

// Static method to find overdue inquiries
contactSchema.statics.findOverdue = function() {
  return this.find({ 'sla.isOverdue': true, status: { $nin: ['resolved', 'closed'] } })
    .populate('assignedTo', 'fullName email')
    .sort({ createdAt: 1 });
};

// Static method to get inquiry statistics
contactSchema.statics.getInquiryStats = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          type: '$inquiryType',
          status: '$status'
        },
        count: { $sum: 1 },
        avgResponseTime: { $avg: '$ageInHours' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

module.exports = mongoose.model('Contact', contactSchema);




// models/ContactMessage.js
// const mongoose = require('mongoose');

// const contactMessageSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     subject: { type: String, required: true },
//     message: { type: String, required: true },
//     status: { type: String, enum: ['unread', 'read', 'replied'], default: 'unread' },
//     createdAt: { type: Date, default: Date.now },
//     adminReply: { type: String },
//     repliedAt: { type: Date }
// });

// module.exports = mongoose.model('ContactMessage', contactMessageSchema);