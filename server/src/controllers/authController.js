const User = require('../models/User');
const otpService = require('../services/otpService');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const paymentService = require('../services/paymentService');
const { generateReferralCode } = require('../utils/constants');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiration, verificationFee } = require('../config');
const ErrorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { paypalUnsupportedCountryCodes } = require('../utils/constants');

// Signup (used for both user and admin-created registrations)
exports.signup = async (req, res, next) => {
  const { firstName, lastName, username, email, countryCode, phone, password, referralCode, acceptTerms, enable2FA, currency = 'USD' } = req.body;

  try {
    if (!acceptTerms) return next(new ErrorHandler(400, 'Must accept terms and conditions'));

    // Check if country is supported by PayPal
    if (paypalUnsupportedCountryCodes.includes(countryCode.toUpperCase())) {
      return next(new ErrorHandler(400, 'Country not supported by PayPal'));
    }

    let user = await User.findOne({ $or: [{ username }, { email }] });
    if (user) return next(new ErrorHandler(400, 'User already exists'));

    const hashedPassword = await bcrypt.hash(password, 12);
    const uniqueReferralCode = generateReferralCode();

    user = new User({
      firstName,
      lastName,
      username,
      email,
      countryCode: countryCode.toUpperCase(),
      phone: `${countryCode}${phone}`,
      password: hashedPassword,
      referralCode: uniqueReferralCode,
      referredBy: referralCode || null,
      acceptTerms,
      enable2FA,
    });

    await user.save();

    // Send email OTP
    const emailOTP = otpService.generateOTP();
    await emailService.sendOTP(email, emailOTP);
    user.emailOTP = emailOTP;
    user.emailOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Send phone OTP
    const phoneOTP = otpService.generateOTP();
    await smsService.sendOTP(user.phone, phoneOTP);
    user.phoneOTP = phoneOTP;
    user.phoneOTPExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    logger.info(`User signup initiated for ${username}. OTPs sent.`);
    res.status(201).json({ message: 'User created. Verify OTPs to complete registration.', userId: user._id });
  } catch (err) {
    logger.error(`Signup error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error during signup'));
  }
};

// Verify OTPs and charge verification fee
exports.verifyOTPs = async (req, res, next) => {
  const { userId, emailOTP, phoneOTP, paymentGateway, paymentDetails, currency = 'USD' } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return next(new ErrorHandler(404, 'User not found'));

    // Verify email OTP
    if (!otpService.verifyOTP(emailOTP, user.emailOTP, user.emailOTPExpires)) {
      return next(new ErrorHandler(400, 'Invalid or expired email OTP'));
    }

    // Verify phone OTP
    if (!otpService.verifyOTP(phoneOTP, user.phoneOTP, user.phoneOTPExpires)) {
      return next(new ErrorHandler(400, 'Invalid or expired phone OTP'));
    }

    user.emailVerified = true;
    user.phoneVerified = true;
    user.emailOTP = undefined;
    user.phoneOTP = undefined;
    await user.save();

    // Process verification fee payment with currency conversion
    const feeTransaction = await paymentService.processPayment({
      amount: verificationFee,
      currency,
      gateway: paymentGateway,
      details: paymentDetails,
      type: 'verification',
      userId: user._id,
    });

    if (!feeTransaction.success) return next(new ErrorHandler(400, 'Verification fee payment failed'));

    logger.info(`User ${userId} verified successfully. Fee paid: ${feeTransaction.localAmount} ${currency}`);
    res.json({ message: 'Verification complete. User registration successful.' });
  } catch (err) {
    logger.error(`OTP verification error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error during OTP verification'));
  }
};

// Login
exports.login = async (req, res, next) => {
  const { identifier, password } = req.body;

  try {
    const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });
    if (!user) return next(new ErrorHandler(401, 'Invalid credentials'));

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return next(new ErrorHandler(401, 'Invalid credentials'));

    if (!user.emailVerified || !user.phoneVerified) return next(new ErrorHandler(403, 'Account not verified'));

    if (user.enable2FA) {
      // Send 2FA OTP via email
      const twoFAOTP = otpService.generateOTP();
      await emailService.sendOTP(user.email, twoFAOTP);
      user.twoFAOTP = twoFAOTP;
      user.twoFAOTPExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
      await user.save();

      return res.json({ message: '2FA OTP sent to email', userId: user._id, requires2FA: true });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, jwtSecret, { expiresIn: jwtExpiration });
    logger.info(`User ${user.username} logged in successfully`);
    res.json({ token });
  } catch (err) {
    logger.error(`Login error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error during login'));
  }
};

// Verify 2FA
exports.verify2FA = async (req, res, next) => {
  const { userId, twoFAOTP } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return next(new ErrorHandler(404, 'User not found'));

    if (!otpService.verifyOTP(twoFAOTP, user.twoFAOTP, user.twoFAOTPExpires)) {
      return next(new ErrorHandler(400, 'Invalid or expired 2FA OTP'));
    }

    user.twoFAOTP = undefined;
    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, jwtSecret, { expiresIn: jwtExpiration });
    logger.info(`User ${user.username} 2FA verified successfully`);
    res.json({ token });
  } catch (err) {
    logger.error(`2FA verification error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error during 2FA verification'));
  }
};

exports.checkUserStatus = async (req, res) => {
  try {
    const { email, phone } = req.body;
    if (!email && !phone) {
      return res.status(400).json({ message: 'Email or phone is required' });
    }

    const user = await User.findOne({ $or: [{ email }, { phone }] });
    if (user) {
      return res.status(200).json({ exists: true, message: 'User already exists' });
    } else {
      return res.status(200).json({ exists: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error in checkUserStatus:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
//resendEmailOTP
exports.resendEmailOTP=async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Validation errors in /resend-email-otp:', { errors: errors.array(), body: req.body });
        return res.status(400).json({ message: errors.array()[0].msg });
      }
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        logger.warn(`User not found for resend email OTP: ${email}`);
        return res.status(404).json({ message: 'user_not_found' });
      }
      const otp = await generateOTP(user._id, 'email');
      await sendEmailOTP(email, otp, user.firstName);
      logger.info(`Email OTP resent to: ${email}, OTP: ${otp}`);
      // Return OTP in development mode for debugging
      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({ message: 'email_otp_resent', otp });
      }
      res.status(200).json({ message: 'email_otp_resent' });
    } catch (error) {
      logger.error(`Resend email OTP error for ${req.body.email || 'unknown'}: ${error.message}`, {
        stack: error.stack,
        body: req.body,
      });
      res.status(500).json({ message: 'server_error', error: error.message });
    }
  };

// RESEND PHONE OTP

 exports.resendPhoneOTP = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Validation errors in /resend-phone-otp:', { errors: errors.array(), body: req.body });
        return res.status(400).json({ message: errors.array()[0].msg });
      }
      const { phone, countryCode } = req.body;
      const cleanPhone = phone.replace(/\s/g, '').replace(countryCode, '');
      const user = await User.findOne({ phone: cleanPhone, countryCode });
      if (!user) {
        logger.warn(`User not found for resend phone OTP: ${phone}`);
        return res.status(404).json({ message: 'user_not_found' });
      }
      const otp = await generateOTP(user._id, 'phone');
      await sendSMSOTP(`${countryCode}${cleanPhone}`, otp);
      logger.info(`Phone OTP resent to: ${phone}, OTP: ${otp}`);
      // Return OTP in development mode for debugging
      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({ message: 'phone_otp_resent', otp });
      }
      res.status(200).json({ message: 'phone_otp_resent' });
    } catch (error) {
      logger.error(`Resend phone OTP error for ${req.body.phone || 'unknown'}: ${error.message}`, {
        stack: error.stack,
        body: req.body,
      });
      res.status(500).json({ message: 'server_error', error: error.message });
    }
  };
  // SETUP 2FA

  exports.setup2FA = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Validation errors in /converter:', { errors: errors.array(), body: req.body });
        return res.status(400).json({ message: errors.array()[0].msg });
      }
      const { userId, enable, code } = req.body;
      const user = await User.findById(userId);
      if (!user) {
        logger.warn(`User not found for 2FA setup: ${userId}`);
        return res.status(404).json({ message: 'user_not_found' });
      }
      const otpRecord = await OTP.findOne({ user: user._id, type: '2fa', code });
      if (!otpRecord) {
        logger.warn(`No OTP record found for 2FA, userId: ${user._id}, code: ${code}`);
        return res.status(400).json({ message: 'invalid_otp', details: 'no_otp_record' });
      }
      if (otpRecord.expiresAt < new Date()) {
        logger.warn(`Expired OTP for 2FA, user: ${user.email}, expiresAt: ${otpRecord.expiresAt}`);
        await OTP.deleteOne({ _id: otpRecord._id });
        return res.status(400).json({ message: 'otp_expired', details: 'otp_expired' });
      }
      user.twoFactorEnabled = enable;
      await user.save();
      await OTP.deleteOne({ _id: otpRecord._id });
      logger.info(`2FA ${enable ? 'enabled' : 'disabled'} for user: ${user.email}`);
      res.status(200).json({ message: '2fa_setup_complete', nextStep: 'verify-payment' });
    } catch (error) {
      logger.error(`2FA setup error for userId ${req.body.userId || 'unknown'}: ${error.message}`, {
        stack: error.stack,
        body: req.body,
      });
      res.status(500).json({ message: 'server_error', error: error.message });
    }
  };


  // RESEND 2FA OTP

  exports.resend2FAOTP=async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Validation errors in /resend-2fa-otp:', { errors: errors.array(), body: req.body });
        return res.status(400).json({ message: errors.array()[0].msg });
      }
      const { userId } = req.body;
      const user = await User.findById(userId);
      if (!user) {
        logger.warn(`User not found for resend 2FA OTP: ${userId}`);
        return res.status(404).json({ message: 'user_not_found' });
      }
      const otp = await generateOTP(user._id, '2fa');
      await sendEmailOTP(user.email, otp, user.firstName);
      logger.info(`2FA OTP resent to: ${user.email}, OTP: ${otp}`);
      // Return OTP in development mode for debugging
      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({ message: '2fa_otp_resent', otp });
      }
      res.status(200).json({ message: '2fa_otp_resent' });
    } catch (error) {
      logger.error(`Resend 2FA OTP error for userId ${req.body.userId || 'unknown'}: ${error.message}`, {
        stack: error.stack,
        body: req.body,
      });
      res.status(500).json({ message: 'server_error', error: error.message });
    }
  };

// FORGOT PASSWORD

  exports.forgotPassword=async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Validation errors in /forgot-password:', { errors: errors.array(), body: req.body });
        return res.status(400).json({ message: errors.array()[0].msg });
      }
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        logger.warn(`User not found for password reset: ${email}`);
        return res.status(404).json({ message: 'user_not_found' });
      }
      const otp = await generateOTP(user._id, 'password_reset');
      await sendEmailOTP(email, otp, user.firstName);
      logger.info(`Password reset OTP sent to: ${email}, OTP: ${otp}`);
      // Return OTP in development mode for debugging
      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({ message: 'password_reset_otp_sent', otp });
      }
      res.status(200).json({ message: 'password_reset_otp_sent' });
    } catch (error) {
      logger.error(`Forgot password error for ${req.body.email || 'unknown'}: ${error.message}`, {
        stack: error.stack,
        body: req.body,
      });
      res.status(500).json({ message: 'server_error', error: error.message });
    }
  };
// session
exports.session= async (req, res) => {
  try {
    logger.info(`Session check for user ID: ${req.user.id}`);
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      logger.warn(`User not found for ID: ${req.user.id}`);
      res.set('Access-Control-Allow-Origin', req.get('Origin') || 'https://fa6c680fbcf6.ngrok-free.app');
      res.set('Access-Control-Allow-Credentials', 'true');
      return res.status(404).json({ message: 'user_not_found' });
    }
    res.set('Access-Control-Allow-Origin', req.get('Origin') || 'https://fa6c680fbcf6.ngrok-free.app');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.json({
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      hasPaidVerificationFee: user.hasPaidVerificationFee,
    });
  } catch (error) {
    logger.error(`Session check error for user ID: ${req.user.id}`, { error: error.message, stack: error.stack });
    res.set('Access-Control-Allow-Origin', req.get('Origin') || 'https://fa6c680fbcf6.ngrok-free.app');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ message: 'server_error', error: error.message });
  }
};
// LOGOUT
exports.logout= async (req, res) => {
  try {
    logger.info(`User logged out: ${req.user.id}`); // Changed to req.user.id
    res.set('Access-Control-Allow-Origin', req.get('Origin') || 'https://fa6c680fbcf6.ngrok-free.app');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.status(200).json({ message: 'logout_success' });
  } catch (error) {
    logger.error(`Logout error for userId ${req.user.id}: ${error.message}`, { // Changed to req.user.id
      stack: error.stack,
    });
    res.set('Access-Control-Allow-Origin', req.get('Origin') || 'https://fa6c680fbcf6.ngrok-free.app');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.status(500).json({ message: 'server_error', error: error.message });
  }
};
