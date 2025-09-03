const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/database");
const transactionRoutes = require('./routes/transaction');
const userDashboardRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");

const cors = require("cors");

dotenv.config();
connectDB();

const app = express();

// --- Safe CORS setup ---
app.use(cors({
  origin: "https://pvbankonline.vercel.app", // frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// Parse JSON
app.use(express.json());

// --- Hardcoded relative route paths only ---
app.use("/api/auth", require("./routes/auth"));
app.use("/api/user/dashboard", userDashboardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use("/api/admin", adminRoutes);

// --- Optional: log injected env vars safely ---
console.log("BASE_URL:", process.env.BASE_URL || "(not set)");
console.log("DEBUG_URL:", process.env.DEBUG_URL || "(not set)");

// --- Fallback for unknown routes ---
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
