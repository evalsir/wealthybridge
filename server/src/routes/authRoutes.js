// server/src/routes/authRoutes.js
console.log('Loading authRoutes.js at:', new Date().toISOString());
const express = require('express');

let authMiddleware;
try {
  authMiddleware = require('../middlewares/authMiddleware');
} catch (err) {
  console.error('Failed to load authMiddleware:', err.message);
  throw new Error('Failed to load authMiddleware module');
}

const { protect } = authMiddleware;
const authController = require('../controllers/authController');
const validationMiddleware = require('../middlewares/validationMiddleware');

const {
  signup,
  verifyEmailOTP,
  verifyPhoneOTP,
  login,
  verify2FA,
  checkUser,
  resendEmailOTP,
  resendPhoneOTP,
  setup2FA,
  resend2FAOTP,
  logout,
  session,
  forgotPassword,
} = authController;

const {
  validateSignup,
  validateVerifyEmailOTP, 
  validateVerifyPhoneOTP,
  validateLogin,
  validate2FA,
  validateCheckUser,
  validateResendEmailOTP,
  validateResendPhoneOTP,
  validateForgotPassword,
  validateResend2FAOTP,
} = validationMiddleware;

const logger = require('../utils/logger');

const router = express.Router();

// Authentication routes
router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.post('/logout', protect, logout);
router.post('/session', protect, session);

// ✅ Updated OTP routes
router.post('/verify-email-otp', validateVerifyEmailOTP, verifyEmailOTP);
router.post('/verify-phone-otp', validateVerifyPhoneOTP, verifyPhoneOTP);

router.post('/verify-2fa', validate2FA, verify2FA);
router.post('/check-user', validateCheckUser, checkUser);
router.post('/resend-email-otp', validateResendEmailOTP, resendEmailOTP);
router.post('/resend-phone-otp', validateResendPhoneOTP, resendPhoneOTP);
router.post('/setup-2fa', protect, validate2FA, setup2FA);
router.post('/resend-2fa-otp', protect, validateResend2FAOTP, resend2FAOTP);
router.post('/forgot-password', validateForgotPassword, forgotPassword);

// Debug: Log all routes
router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    logger.info(`Registered auth route: ${Object.keys(r.route.methods).join(',')} ${r.route.path}`);
  }
});

// Catch-all for unmatched routes
router.use((req, res, next) => {
  logger.warn(`Unmatched auth route: ${req.method} ${req.originalUrl}`);
  next(new Error('Cannot find the requested resource', 404));
});

module.exports = router;
