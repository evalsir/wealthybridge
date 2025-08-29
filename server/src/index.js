// server/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const commentRoutes = require('./routes/commentRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const maintenanceMiddleware = require('./middlewares/maintenanceMiddleware');
const logger = require('./utils/logger');

// Log file paths
console.log('Loading routes from:', {
  authRoutes: path.resolve(__dirname, './routes/authRoutes.js'),
  userRoutes: path.resolve(__dirname, './routes/userRoutes.js'),
  paymentRoutes: path.resolve(__dirname, './routes/paymentRoutes.js')
});

// Clear module cache
delete require.cache[require.resolve('./controllers/authController')];
delete require.cache[require.resolve('./controllers/paymentController')];
delete require.cache[require.resolve('./controllers/userController')];
delete require.cache[require.resolve('./middlewares/authMiddleware')];
delete require.cache[require.resolve('./middlewares/validationMiddleware')];
delete require.cache[require.resolve('./services/paymentService')];
delete require.cache[require.resolve('./services/emailService')];
delete require.cache[require.resolve('./services/smsService')];
delete require.cache[require.resolve('./utils/errorHandler')];
delete require.cache[require.resolve('./utils/logger')];
delete require.cache[require.resolve('./routes/authRoutes')];
delete require.cache[require.resolve('./routes/paymentRoutes')];

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  process.env.CLIENT_URL || 'https://ef8873279cee.ngrok-free.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

app.use(helmet());
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

app.use((req, res, next) => {
  logger.info(`Incoming ${req.method} ${req.url} from ${req.get('Origin') || 'unknown'}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(maintenanceMiddleware);

console.log('Registering routes:', {
  authRoutes: !!authRoutes,
  userRoutes: !!userRoutes,
  investmentRoutes: !!investmentRoutes,
  paymentRoutes: !!paymentRoutes,
  adminRoutes: !!adminRoutes,
  commentRoutes: !!commentRoutes
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/comments', commentRoutes);

app.use(errorMiddleware);

module.exports = app;

console.log('index exports:', module.exports);