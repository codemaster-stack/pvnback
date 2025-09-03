const express = require("express"); 
const dotenv = require("dotenv");
const connectDB = require("./config/database");
const cors = require("cors");

dotenv.config();
connectDB();

const app = express();

// ✅ CORS setup
app.use(cors({
  origin: "https://pvbankonline.vercel.app",  // frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// ❌ remove this → app.options("*", cors());

// Parse JSON
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
