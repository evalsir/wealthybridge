//src routes/authroutes.js
const express = require('express');
const { protect } = require('../middlewares/authMiddleware');

const { signup, verifyOTPs, login, verify2FA,  checkUserStatus,
   resendEmailOTP,resendPhoneOTP,setup2FA,resend2FAOTP,logout,session,
  forgotPassword,  
} = require('../controllers/authController');
const { validateSignup, validateVerifyOTPs, validateLogin, validate2FA } = require('../middlewares/validationMiddleware');

const router = express.Router();

router.post('/register', validateSignup, signup);
router.post('/verify-otps', validateVerifyOTPs, verifyOTPs);
router.post('/login', validateLogin, login);
router.post('/logout',logout);
router.post('/session', session);
router.post('/verify-2fa', validate2FA, verify2FA);
router.post('/register', validateSignup, signup);
router.post('/check-user', checkUserStatus);
router.post('/resend-email-otp', resendEmailOTP );
router.post('/resend-phone-otp', resendPhoneOTP);
router.post('/setup-2fa', protect, setup2FA);
router.post('/resend-2fa-otp', protect, resend2FAOTP);
router.post('/forgot-password', forgotPassword);


// Debug
console.log('authRoutes in authRoutes:', router);

module.exports = router;