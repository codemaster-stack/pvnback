// server.js
const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db"); // MongoDB connection
const authRoutes = require("./routes/authRoutes"); // Auth routes
const cors = require("cors");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// CORS: allow only your frontend
app.use(cors({
    origin: "https://www.pvbonline.online", // your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));

// Routes
app.use("/api/auth", authRoutes);

// Fallback for unknown routes
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Connect DB and start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error("DB connection failed:", err.message);
});
