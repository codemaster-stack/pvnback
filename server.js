// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const compression = require('compression');
// const morgan = require('morgan');
// require('dotenv').config();

// // Import routes
// const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/users');
// const accountRoutes = require('./routes/accounts');
// const transactionRoutes = require('./routes/transactions');
// const cardRoutes = require('./routes/cards');
// const contactRoutes = require('./routes/contact');
// const adminRoutes = require('./routes/admin');

// // Import middleware
// const errorHandler = require('./middleware/errorHandler');
// const { authenticateToken } = require('./middleware/auth');

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Security middleware
// app.use(helmet({
//   crossOriginEmbedderPolicy: false,
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       scriptSrc: ["'self'"],
//       imgSrc: ["'self'", "data:", "https:"]
//     }
//   }
// }));

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: {
//     error: 'Too many requests from this IP, please try again later.'
//   }
// });

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // limit each IP to 5 auth requests per windowMs
//   message: {
//     error: 'Too many authentication attempts, please try again later.'
//   }
// });

// app.use(limiter);
// app.use(compression());
// app.use(morgan('combined'));

// // CORS configuration
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true
// }));

// // Body parsing middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Database connection
// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pvnb', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => {
//   console.log('✅ Connected to MongoDB');
// })
// .catch((error) => {
//   console.error('❌ MongoDB connection error:', error);
//   process.exit(1);
// });

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.status(200).json({
//     status: 'OK',
//     timestamp: new Date().toISOString(),
//     uptime: process.uptime(),
//     environment: process.env.NODE_ENV || 'development'
//   });
// });

// // API routes
// app.use('/api/auth', authLimiter, authRoutes);
// app.use('/api/users', authenticateToken, userRoutes);
// app.use('/api/accounts', authenticateToken, accountRoutes);
// app.use('/api/transactions', authenticateToken, transactionRoutes);
// app.use('/api/cards', authenticateToken, cardRoutes);
// app.use('/api/contact', contactRoutes);
// app.use('/api/admin', authenticateToken, adminRoutes);

// // Serve static files in production
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static('public'));
  
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
//   });
// }

// // 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({
//     error: 'Route not found',
//     path: req.originalUrl,
//     method: req.method
//   });
// });

// // Global error handler
// app.use(errorHandler);

// // Graceful shutdown
// process.on('SIGTERM', () => {
//   console.log('SIGTERM received. Shutting down gracefully...');
//   mongoose.connection.close(() => {
//     console.log('MongoDB connection closed.');
//     process.exit(0);
//   });
// });

// process.on('SIGINT', () => {
//   console.log('SIGINT received. Shutting down gracefully...');
//   mongoose.connection.close(() => {
//     console.log('MongoDB connection closed.');
//     process.exit(0);
//   });
// });

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
//   console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
// });

// module.exports = app;











const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/database");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
