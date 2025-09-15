// server.js
const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const supportRoutes = require("./routes/supportRoutes");
const loanRoutes = require("./routes/loan");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const transferRoutes = require("./routes/transferRoutes");
const txRoutes = require("./routes/transaction");
const pinRoutes = require("./routes/pin");
const cors = require("cors");
const accountRoutes = require("./routes/account");
const dashboardRoutes = require("./routes/dashboard");





dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- Chat Schema ---
const ChatSchema = new mongoose.Schema({
  sender: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});
const Chat = mongoose.model("Chat", ChatSchema);

// --- Socket.io ---
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  Chat.find().then(history => {
    socket.emit("chatHistory", history);
  });

  socket.on("chatMessage", async (data) => {
    const newMsg = new Chat(data);
    await newMsg.save();
    io.emit("chatMessage", newMsg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// --- Middleware ---
app.use(express.json());
app.use(cors({
  origin: "https://www.pvbonline.online", 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/loan", loanRoutes);
app.use("/api/auth/admin", adminAuthRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/transactions", txRoutes);
app.use("/api/pin", pinRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/dashboard", dashboardRoutes);

// --- Fallback ---
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("DB connection failed:", err.message);
});
