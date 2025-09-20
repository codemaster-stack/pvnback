// server.js
require("dotenv").config();
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db"); 
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const errorHandler = require("./middleware/errorHandler");
const userRoutes = require("./routes/userRoutes");
const contactRoutes = require("./routes/contactRoutes");
const publicLoanRoutes = require("./routes/publicLoanRoutes");
const transactionRoutes = require("./routes/transactionRoutes");


const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();
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


// Fix preflight CORS issues on Render
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", ["https://www.pvbonline.online", "https://pvbonline.online"]);
//   res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.header("Access-Control-Allow-Credentials", "true");
//   if (req.method === "OPTIONS") {
//     return res.sendStatus(200);
//   }
//   next();
// });


// Routes
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/public/loans", publicLoanRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/transaction", transactionRoutes);


app.use(express.static(path.join(__dirname, "frontend")));
app.use("/uploads", express.static("uploads"));

// Error handler
app.use(errorHandler);

// --- Socket.IO setup ---
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://www.pvbonline.online", "https://pvbonline.online"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  socket.on("joinAdmin", (adminId) => {
    socket.join("admins");
    console.log(`Admin ${adminId} joined`);
  });

  socket.on("visitorMessage", (data) => {
    console.log("Visitor message:", data);
    // send to admins
    io.to("admins").emit("chatMessage", { sender: "visitor", ...data });
  });

  socket.on("adminMessage", ({ visitorId, text }) => {
    console.log(`Admin replying to ${visitorId}:`, text);
    io.to(visitorId).emit("chatMessage", { sender: "admin", text });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected", socket.id);
  });
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
