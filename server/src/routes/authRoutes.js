// server/src/routes/authRoutes.js
const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
  signup,
  verifyOTPs,
  login,
  verify2FA,
  checkUserStatus,
  resendEmailOTP,
  resendPhoneOTP,
  setup2FA,
  resend2FAOTP,
  logout,
  session,
  forgotPassword,
} = require('../controllers/authController');
const { validateSignup, validateVerifyOTPs, validateLogin, validate2FA } = require('../middlewares/validationMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

// Authentication routes
router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.post('/logout', protect, logout);
router.post('/session', protect, session);
router.post('/verify-otps', validateVerifyOTPs, verifyOTPs);
router.post('/verify-2fa', validate2FA, verify2FA);
router.post('/check-user', checkUserStatus);
router.post('/resend-email-otp', resendEmailOTP);
router.post('/resend-phone-otp', resendPhoneOTP);
router.post('/setup-2fa', protect, setup2FA);
router.post('/resend-2fa-otp', protect, resend2FAOTP);
router.post('/forgot-password', forgotPassword);

// Payment callback routes
router.post('/payment/callback/:method', protect, (req, res, next) => {
  const { method } = req.params;
  const { userId, transactionId } = req.body;
  logger.info(`Payment callback for method: ${method}, userId: ${userId}, transactionId: ${transactionId}`);
  require('../controllers/authController').processPaymentCallback(req, res, next);
});

// Debug: Log all routes
router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    logger.info(`Registered route: ${Object.keys(r.route.methods).join(',')} ${r.route.path}`);
  }
});

// Catch unregistered routes
router.use((req, res, next) => {
  logger.warn(`Unmatched route: ${req.method} ${req.originalUrl}`);
  next(new Error('Cannot find the requested resource', 404));
});

module.exports = router;