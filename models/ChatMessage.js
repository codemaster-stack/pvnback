// const mongoose = require('mongoose');

// const chatMessageSchema = new mongoose.Schema({
//     userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//     },
//     message: {
//         type: String,
//         required: true,
//         trim: true
//     },
//     sender: {
//         type: String,
//         enum: ['user', 'admin'],
//         required: true
//     },
//     adminId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Admin',
//         required: function() { return this.sender === 'admin'; }
//     },
//     isRead: {
//         type: Boolean,
//         default: false
//     },
//     chatSession: {
//         type: String,
//         required: true
//     }
// }, {
//     timestamps: true
// });

// // Index for better query performance
// chatMessageSchema.index({ chatSession: 1, createdAt: 1 });

// module.exports = mongoose.model('ChatMessage', chatMessageSchema);



const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    chatSession: {
        type: String,
        required: true,
        index: true // For faster queries
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // or 'Admin' if you have separate admin model
        default: null
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    sender: {
        type: String,
        required: true,
        enum: ['user', 'admin', 'system'],
        default: 'user'
    },
    isFromSupport: {
        type: Boolean,
        default: false
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isSessionActive: {
        type: Boolean,
        default: true
    },
    attachments: [{
        fileName: String,
        fileUrl: String,
        fileType: String
    }],
    metadata: {
        type: Map,
        of: String,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes for better performance
chatMessageSchema.index({ chatSession: 1, createdAt: 1 });
chatMessageSchema.index({ chatSession: 1, sender: 1, isRead: 1 });
chatMessageSchema.index({ isSessionActive: 1, createdAt: -1 });

// Virtual to get formatted timestamp
chatMessageSchema.virtual('formattedTime').get(function() {
    return this.createdAt.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);