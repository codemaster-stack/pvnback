const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

// Get chat history for a user
// exports.getChatHistory = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         const messages = await ChatMessage.find({ chatSession: userId })
//             .populate('userId', 'fullName')
//             .populate('adminId', 'fullName')
//             .sort({ createdAt: 1 });
        
//         res.json(messages);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching chat history' });
//     }
// };

// // Admin gets all active chat sessions
// exports.getActiveChatSessions = async (req, res) => {
//     try {
//         const sessions = await ChatMessage.aggregate([
//             {
//                 $group: {
//                     _id: '$chatSession',
//                     lastMessage: { $last: '$message' },
//                     lastMessageTime: { $last: '$createdAt' },
//                     unreadCount: {
//                         $sum: {
//                             $cond: [
//                                 { $and: [{ $eq: ['$sender', 'user'] }, { $eq: ['$isRead', false] }] },
//                                 1,
//                                 0
//                             ]
//                         }
//                     }
//                 }
//             },
//             { $sort: { lastMessageTime: -1 } }
//         ]);

//         // Populate user details
//         const populatedSessions = await User.populate(sessions, {
//             path: '_id',
//             select: 'fullName email'
//         });

//         res.json(populatedSessions);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching chat sessions' });
//     }
// };

// // Get messages for specific user (admin view)
// exports.getUserChatHistory = async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const messages = await ChatMessage.find({ chatSession: userId })
//             .populate('userId', 'fullName')
//             .populate('adminId', 'fullName')
//             .sort({ createdAt: 1 });

//         // Mark admin messages as read
//         await ChatMessage.updateMany(
//             { chatSession: userId, sender: 'user', isRead: false },
//             { isRead: true }
//         );
        
//         res.json(messages);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching user chat history' });
//     }
// };

exports.startChatSession = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Check if user already has an active session
        const existingSession = await ChatMessage.findOne({ 
            chatSession: userId,
            isSessionActive: true 
        });
        
        if (existingSession) {
            return res.json({ 
                sessionId: userId, 
                message: 'Existing session found' 
            });
        }
        
        // Create initial message to start session
        const initialMessage = new ChatMessage({
            chatSession: userId,
            userId: userId,
            message: 'Chat session started',
            sender: 'system',
            isSessionActive: true
        });
        
        await initialMessage.save();
        
        res.json({ 
            sessionId: userId, 
            message: 'Chat session started successfully' 
        });
        
    } catch (error) {
        console.error('Start chat session error:', error);
        res.status(500).json({ message: 'Error starting chat session' });
    }
};

// Send a message (USER & ADMIN)
exports.sendMessage = async (req, res) => {
    try {
        const { sessionId, message, isFromSupport } = req.body;
        const userId = req.user.id;
        
        if (!message || !sessionId) {
            return res.status(400).json({ message: 'Session ID and message are required' });
        }
        
        // Determine sender type
        let sender, senderId, senderModel;
        
        if (isFromSupport) {
            // Admin sending message
            sender = 'admin';
            senderId = userId; // Admin user ID
            senderModel = 'Admin';
        } else {
            // User sending message
            sender = 'user';
            senderId = userId;
            senderModel = 'User';
        }
        
        const newMessage = new ChatMessage({
            chatSession: sessionId,
            userId: isFromSupport ? sessionId : userId, // Target user ID for session
            adminId: isFromSupport ? userId : null,
            message: message.trim(),
            sender: sender,
            isFromSupport: isFromSupport || false,
            isSessionActive: true
        });
        
        await newMessage.save();
        
        // Populate sender info
        await newMessage.populate(isFromSupport ? 'adminId' : 'userId', 'fullName email');
        
        res.json({ 
            message: 'Message sent successfully',
            messageData: newMessage
        });
        
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Error sending message' });
    }
};

// Get chat messages for a session (USER & ADMIN)
exports.getChatMessages = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;
        
        // For users, they can only access their own chat
        // For admins, they can access any chat session
        if (!req.user.isAdmin && sessionId !== userId.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const messages = await ChatMessage.find({ 
            chatSession: sessionId,
            sender: { $ne: 'system' } // Exclude system messages
        })
        .populate('userId', 'fullName email')
        .populate('adminId', 'fullName email')
        .sort({ createdAt: 1 });
        
        // Mark messages as read if user is viewing
        if (!req.user.isAdmin) {
            await ChatMessage.updateMany(
                { chatSession: sessionId, sender: 'admin', isRead: false },
                { isRead: true }
            );
        } else {
            // Admin viewing - mark user messages as read
            await ChatMessage.updateMany(
                { chatSession: sessionId, sender: 'user', isRead: false },
                { isRead: true }
            );
        }
        
        res.json({ messages });
        
    } catch (error) {
        console.error('Get chat messages error:', error);
        res.status(500).json({ message: 'Error fetching chat messages' });
    }
};

// Get new messages since last check (POLLING)
exports.getNewMessages = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { after } = req.query; // Message ID to get messages after
        const userId = req.user.id;
        
        // Access control
        if (!req.user.isAdmin && sessionId !== userId.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        let query = { 
            chatSession: sessionId,
            sender: { $ne: 'system' }
        };
        
        // If polling for messages after a specific message
        if (after) {
            query._id = { $gt: after };
        }
        
        // For users, get only admin messages they haven't seen
        if (!req.user.isAdmin) {
            query.sender = 'admin';
            // Get messages from the last 30 seconds to catch new ones
            const thirtySecondsAgo = new Date(Date.now() - 30000);
            query.createdAt = { $gte: thirtySecondsAgo };
        } else {
            // For admins, get user messages
            query.sender = 'user';
            const thirtySecondsAgo = new Date(Date.now() - 30000);
            query.createdAt = { $gte: thirtySecondsAgo };
        }
        
        const messages = await ChatMessage.find(query)
            .populate('userId', 'fullName email')
            .populate('adminId', 'fullName email')
            .sort({ createdAt: 1 })
            .limit(50); // Limit to prevent large responses
        
        res.json({ messages });
        
    } catch (error) {
        console.error('Get new messages error:', error);
        res.status(500).json({ message: 'Error fetching new messages' });
    }
};

// End chat session (USER & ADMIN)
exports.endChatSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;
        
        // Access control
        if (!req.user.isAdmin && sessionId !== userId.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        // Mark session as inactive
        await ChatMessage.updateMany(
            { chatSession: sessionId },
            { isSessionActive: false }
        );
        
        // Add session end message
        const endMessage = new ChatMessage({
            chatSession: sessionId,
            userId: sessionId,
            message: 'Chat session ended',
            sender: 'system',
            isSessionActive: false
        });
        
        await endMessage.save();
        
        res.json({ message: 'Chat session ended successfully' });
        
    } catch (error) {
        console.error('End chat session error:', error);
        res.status(500).json({ message: 'Error ending chat session' });
    }
};

// Get chat history for a user (USER)
exports.getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const messages = await ChatMessage.find({ 
            chatSession: userId,
            sender: { $ne: 'system' }
        })
        .populate('userId', 'fullName')
        .populate('adminId', 'fullName')
        .sort({ createdAt: 1 });
        
        res.json({ messages });
    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({ message: 'Error fetching chat history' });
    }
};

// Admin gets all active chat sessions (ADMIN ONLY)
exports.getActiveChatSessions = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        const sessions = await ChatMessage.aggregate([
            {
                $match: {
                    isSessionActive: true,
                    sender: { $ne: 'system' }
                }
            },
            {
                $group: {
                    _id: '$chatSession',
                    lastMessage: { $last: '$message' },
                    lastMessageTime: { $last: '$createdAt' },
                    lastSender: { $last: '$sender' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ['$sender', 'user'] }, { $eq: ['$isRead', false] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { lastMessageTime: -1 } }
        ]);

        // Populate user details
        const populatedSessions = await User.populate(sessions, {
            path: '_id',
            select: 'fullName email'
        });

        res.json({ sessions: populatedSessions });
    } catch (error) {
        console.error('Get active chat sessions error:', error);
        res.status(500).json({ message: 'Error fetching chat sessions' });
    }
};

// Get messages for specific user (ADMIN VIEW)
exports.getUserChatHistory = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        const { userId } = req.params;
        const messages = await ChatMessage.find({ 
            chatSession: userId,
            sender: { $ne: 'system' }
        })
        .populate('userId', 'fullName email')
        .populate('adminId', 'fullName email')
        .sort({ createdAt: 1 });

        // Mark user messages as read
        await ChatMessage.updateMany(
            { chatSession: userId, sender: 'user', isRead: false },
            { isRead: true }
        );
        
        res.json({ messages });
    } catch (error) {
        console.error('Get user chat history error:', error);
        res.status(500).json({ message: 'Error fetching user chat history' });
    }
};

// Get chat statistics (ADMIN ONLY)
exports.getChatStats = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        const stats = await ChatMessage.aggregate([
            {
                $group: {
                    _id: null,
                    totalSessions: { $addToSet: '$chatSession' },
                    totalMessages: { $sum: 1 },
                    unreadMessages: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ['$sender', 'user'] }, { $eq: ['$isRead', false] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    totalSessions: { $size: '$totalSessions' },
                    totalMessages: 1,
                    unreadMessages: 1
                }
            }
        ]);
        
        const result = stats[0] || {
            totalSessions: 0,
            totalMessages: 0,
            unreadMessages: 0
        };
        
        res.json(result);
        
    } catch (error) {
        console.error('Get chat stats error:', error);
        res.status(500).json({ message: 'Error fetching chat statistics' });
    }
};