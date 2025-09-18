// // server.js
require("dotenv").config();
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db"); // import db connection
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const errorHandler = require("./middleware/errorHandler");
const userRoutes = require("./routes/userRoutes");
const contactRoutes = require("./routes/contactRoutes")
const publicLoanRoutes = require("./routes/publicLoanRoutes");


const path = require("path");

dotenv.config();

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes)
app.use("/api/public/loans", publicLoanRoutes);




app.use(express.static(path.join(__dirname, "frontend")));


// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

