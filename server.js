const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const dotenv = require("dotenv");
const connectDB = require("./config/database");
const transactionRoutes = require('./routes/transaction');
const userDashboardRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const { protect } = require("./middleware/auth");
const ChatMessage = require("./models/ChatMessage"); // You'll create this
const jwt = require("jsonwebtoken");

const cors = require("cors");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: "https://pvbankonline.vercel.app",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// --- Safe CORS setup ---
app.use(cors({
  origin: "https://pvbankonline.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// Parse JSON
app.use(express.json());

// --- Routes ---
app.use("/api/auth", require("./routes/auth"));
app.use("/api/user/dashboard", userDashboardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use("/api/admin", protect, adminRoutes);

// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userType = decoded.isAdmin ? 'admin' : 'user';
    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  console.log(`${socket.userType} connected: ${socket.userId}`);

  // Join user to their own room
  if (socket.userType === 'user') {
    socket.join(`user_${socket.userId}`);
  } else if (socket.userType === 'admin') {
    socket.join('admin_room');
  }

  // Handle user sending message
  socket.on('send_message', async (data) => {
    try {
      const { message, recipientId } = data;
      
      const chatMessage = new ChatMessage({
        userId: socket.userType === 'user' ? socket.userId : recipientId,
        message,
        sender: socket.userType,
        adminId: socket.userType === 'admin' ? socket.userId : undefined,
        chatSession: socket.userType === 'user' ? socket.userId : recipientId,
        isRead: false
      });

      await chatMessage.save();
      await chatMessage.populate('userId', 'fullName');
      await chatMessage.populate('adminId', 'fullName');

      // Send to recipient
      if (socket.userType === 'user') {
        // User sending to admin
        io.to('admin_room').emit('new_message', {
          ...chatMessage.toObject(),
          chatSession: socket.userId
        });
      } else {
        // Admin sending to user
        io.to(`user_${recipientId}`).emit('new_message', chatMessage.toObject());
      }

      // Confirm to sender
      socket.emit('message_sent', chatMessage.toObject());
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle admin joining a chat session
  socket.on('join_chat_session', (userId) => {
    if (socket.userType === 'admin') {
      socket.join(`chat_${userId}`);
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    if (socket.userType === 'user') {
      io.to('admin_room').emit('user_typing', {
        userId: socket.userId,
        typing: data.typing
      });
    } else {
      io.to(`user_${data.userId}`).emit('admin_typing', {
        typing: data.typing
      });
    }
  });

  socket.on('disconnect', () => {
    console.log(`${socket.userType} disconnected: ${socket.userId}`);
  });
});

// --- Optional: log injected env vars safely ---
console.log("BASE_URL:", process.env.BASE_URL || "(not set)");
console.log("DEBUG_URL:", process.env.DEBUG_URL || "(not set)");

// --- Fallback for unknown routes ---
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));