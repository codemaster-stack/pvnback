// server.js
require("dotenv").config();
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db"); // import db connection
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const errorHandler = require("./middleware/errorHandler");
const userRoutes = require("./routes/userRoutes");
const contactRoutes = require("./routes/contactRoutes");
const publicLoanRoutes = require("./routes/publicLoanRoutes");

const path = require("path");
const http = require("http"); // ✅ needed for socket.io
const { Server } = require("socket.io");

dotenv.config();

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["https://www.pvbonline.online", "https://pvbonline.online"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Routes
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/public/loans", publicLoanRoutes);

app.use(express.static(path.join(__dirname, "frontend")));

// Error Handler
app.use(errorHandler);

// ✅ Create HTTP server & attach Socket.IO
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://www.pvbonline.online", "https://pvbonline.online"],
    methods: ["GET", "POST"],
  },
});

// ✅ Socket.IO events
io.on("connection", (socket) => {
  console.log("⚡ New client connected:", socket.id);

  // User sends a message
  socket.on("userMessage", (msg) => {
    console.log("💬 User:", msg);
    // Forward to admin(s)
    io.emit("adminMessage", msg);
  });

  // Admin sends a reply
  socket.on("adminMessage", (msg) => {
    console.log("🛠️ Admin:", msg);
    // Forward to users
    io.emit("userMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
