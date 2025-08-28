// server/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const commentRoutes = require('./routes/commentRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const maintenanceMiddleware = require('./middlewares/maintenanceMiddleware');
const logger = require('./utils/logger');

// Clear module cache for userController
delete require.cache[require.resolve('./controllers/userController')];

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  process.env.CLIENT_URL || 'https://ef8873279cee.ngrok-free.app', // Prioritize .env
  'http://localhost:3000', // Local dev
  'http://localhost:5173', // Vite default port
];

// Use Helmet for security
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Fix: Add request logging middleware
app.use((req, res, next) => {
  logger.info(`Incoming ${req.method} ${req.url} from ${req.get('Origin') || 'unknown'}`);
  next();
});

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(maintenanceMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentRoutes);

// Error handler
app.use(errorMiddleware);

module.exports = app;