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

//  Allowed origins for CORS (specific URLs, not '*')
const allowedOrigins = [
  process.env.CLIENT_URL,              // from .env (frontend ngrok)
  'http://localhost:3000',            // for local dev
];

// Use Helmet for security
app.use(helmet());

//  REMOVE this line:
// app.use(cors({ origin: '*' }));

//  Correct CORS configuration for cookies and Authorization header
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true //  allows cookies and auth headers
}));

// Preflight for all routes
app.options('*', cors({
  origin: allowedOrigins,
  credentials: true
}));

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
