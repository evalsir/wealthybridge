// server/src/controllers/authController.js
const User = require('../models/User');
const OTP = require('../models/OTP'); // Fix: Added OTP model import
const otpService = require('../services/otpService');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const paymentService = require('../services/paymentService');
const { generateReferralCode, paypalUnsupportedCountryCodes } = require('../utils/constants');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator'); // Fix: Added import
const { jwtSecret, jwtExpiration, verificationFee } = require('../config');
const ErrorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');

const sendEmailOTP = async (email, otp, firstName) => {
  await emailService.sendOTP(email, otp, firstName);
};

const sendSMSOTP = async (phone, otp) => {
  await smsService.sendOTP(phone, otp);
};

const generateOTP = async (userId, type) => {
  const otp = otpService.generateOTP();
  await OTP.create({
    user: userId,
    type,
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });
  return otp;
};

// Signup
exports.signup = async (req, res, next) => {
  const { firstName, secondName, username, email, countryCode, phone, password, referralCode, termsAccepted, enable2FA, currency = 'USD' } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorHandler(400, errors.array()[0].msg));
    }

    if (!termsAccepted) return next(new ErrorHandler(400, 'Must accept terms and conditions'));

    if (paypalUnsupportedCountryCodes.includes(countryCode.toUpperCase())) {
      return next(new ErrorHandler(400, 'Country not supported by PayPal'));
    }

    let user = await User.findOne({ $or: [{ username }, { email }, { phone: `${countryCode}${phone}` }] });
    if (user) {
      // Fix: Return userId and token for existing users
      const token = jwt.sign({ userId: user._id, role: user.role }, jwtSecret, { expiresIn: jwtExpiration });
      return res.status(400).json({ message: 'user_exists', userId: user._id, token });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const uniqueReferralCode = generateReferralCode();

    user = new User({
      firstName,
      secondName,
      name: `${firstName} ${secondName}`,
      username,
      email,
      countryCode: countryCode.toUpperCase(),
      phone: `${countryCode}${phone}`,
      password: hashedPassword,
      referralCode: uniqueReferralCode,
      referredBy: referralCode || null,
      termsAccepted,
      enable2FA,
    });

    await user.save();

    // Send email OTP
    const emailOTP = await generateOTP(user._id, 'email');
    await sendEmailOTP(email, emailOTP, firstName);
    user.emailOTP = emailOTP;
    user.emailOTPExpires = Date.now() + 10 * 60 * 1000;

    // Send phone OTP
    const phoneOTP = await generateOTP(user._id, 'phone');
    await sendSMSOTP(`${countryCode}${phone}`, phoneOTP);
    user.phoneOTP = phoneOTP;
    user.phoneOTPExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Fix: Generate token
    const token = jwt.sign({ userId: user._id, role: user.role }, jwtSecret, { expiresIn: jwtExpiration });

    logger.info(`User signup initiated for ${username}. OTPs sent.`);
    res.status(201).json({ message: 'email_otp_resent', userId: user._id, token });
  } catch (err) {
    logger.error(`Signup error for ${username || email}: ${err.message}`, { stack: err.stack });
    next(new ErrorHandler(500, 'Server error during signup'));
  }
};

// Verify OTPs and charge verification fee
exports.verifyOTPs = async (req, res, next) => {
  const { userId, emailOTP, phoneOTP, paymentGateway, paymentDetails, currency = 'USD' } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorHandler(400, errors.array()[0].msg));
    }

    const user = await User.findById(userId);
    if (!user) return next(new ErrorHandler(404, 'User not found'));

    // Verify email OTP
    const emailOtpRecord = await OTP.findOne({ user: user._id, type: 'email', code: emailOTP });
    if (!emailOtpRecord || emailOtpRecord.expiresAt < new Date()) {
      return next(new ErrorHandler(400, 'Invalid or expired email OTP'));
    }

    // Verify phone OTP
    const phoneOtpRecord = await OTP.findOne({ user: user._id, type: 'phone', code: phoneOTP });
    if (!phoneOtpRecord || phoneOtpRecord.expiresAt < new Date()) {
      return next(new ErrorHandler(400, 'Invalid or expired phone OTP'));
    }

    user.emailVerified = true;
    user.phoneVerified = true;
    user.emailOTP = undefined;
    user.phoneOTP = undefined;
    await user.save();

    await OTP.deleteMany({ user: user._id, type: { $in: ['email', 'phone'] } });

    // Fix: Only process payment if not already paid
    if (!user.hasPaidVerificationFee) {
      const feeTransaction = await paymentService.processPayment({
        amount: verificationFee,
        currency,
        gateway: paymentGateway,
        details: paymentDetails,
        type: 'verification',
        userId: user._id,
      });

      if (!feeTransaction.success) return next(new ErrorHandler(400, 'Verification fee payment failed'));

      user.hasPaidVerificationFee = true;
      await user.save();
    }

    logger.info(`User ${userId} verified successfully. Fee paid: ${verificationFee} ${currency}`);
    res.json({ message: 'user_verified', userId: user._id });
  } catch (err) {
    logger.error(`OTP verification error for userId ${userId}: ${err.message}`, { stack: err.stack });
    next(new ErrorHandler(500, 'Server error during OTP verification'));
  }
};

// Login
exports.login = async (req, res, next) => {
  const { usernameOrEmail: identifier, password, twoFactorCode } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorHandler(400, errors.array()[0].msg));
    }

    const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });
    if (!user) return next(new ErrorHandler(401, 'Invalid credentials'));

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return next(new ErrorHandler(401, 'Invalid credentials'));

    if (!user.emailVerified) return next(new ErrorHandler(403, 'email_otp_resent'));
    if (!user.phoneVerified) return next(new ErrorHandler(403, 'phone_otp_resent'));
    if (!user.hasPaidVerificationFee) return next(new ErrorHandler(403, 'payment_required'));

    if (user.enable2FA && !twoFactorCode) {
      const twoFAOTP = await generateOTP(user._id, '2fa');
      await sendEmailOTP(user.email, twoFAOTP, user.firstName);
      return res.json({ message: '2fa_required', userId: user._id, requires2FA: true });
    }

    if (user.enable2FA && twoFactorCode) {
      const otpRecord = await OTP.findOne({ user: user._id, type: '2fa', code: twoFactorCode });
      if (!otpRecord || otpRecord.expiresAt < new Date()) {
        return next(new ErrorHandler(400, 'Invalid or expired 2FA OTP'));
      }
      await OTP.deleteOne({ _id: otpRecord._id });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, jwtSecret, { expiresIn: jwtExpiration });
    logger.info(`User ${user.username} logged in successfully`);
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    logger.error(`Login error for ${identifier}: ${err.message}`, { stack: err.stack });
    next(new ErrorHandler(500, 'Server error during login'));
  }
};

// Verify 2FA
exports.verify2FA = async (req, res, next) => {
  const { userId, twoFAOTP } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorHandler(400, errors.array()[0].msg));
    }

    const user = await User.findById(userId);
    if (!user) return next(new ErrorHandler(404, 'User not found'));

    const otpRecord = await OTP.findOne({ user: user._id, type: '2fa', code: twoFAOTP });
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return next(new ErrorHandler(400, 'Invalid or expired 2FA OTP'));
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    const token = jwt.sign({ userId: user._id, role: user.role }, jwtSecret, { expiresIn: jwtExpiration });
    logger.info(`User ${user.username} 2FA verified successfully`);
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    logger.error(`2FA verification error for userId ${userId}: ${err.message}`, { stack: err.stack });
    next(new ErrorHandler(500, 'Server error during 2FA verification'));
  }
};

// Check User Status
exports.checkUserStatus = async (req, res, next) => {
  try {
    const { email, phone, countryCode } = req.body;
    if (!email && !phone) {
      return next(new ErrorHandler(400, 'Email or phone is required'));
    }

    const query = {};
    if (email) query.email = email;
    if (phone && countryCode) query.phone = `${countryCode}${phone.replace(/\s/g, '')}`;

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ message: 'user_not_found' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, jwtSecret, { expiresIn: jwtExpiration });

    if (user.hasPaidVerificationFee && user.emailVerified && user.phoneVerified) {
      return res.status(200).json({ message: 'user_verified', userId: user._id, token });
    }
    if (!user.emailVerified) {
      const emailOTP = await generateOTP(user._id, 'email');
      await sendEmailOTP(user.email, emailOTP, user.firstName);
      return res.status(200).json({ message: 'email_otp_resent', userId: user._id, token });
    }
    if (!user.phoneVerified) {
      const phoneOTP = await generateOTP(user._id, 'phone');
      await sendSMSOTP(user.phone, phoneOTP);
      return res.status(200).json({ message: 'phone_otp_resent', userId: user._id, token });
    }
    if (!user.hasPaidVerificationFee) {
      return res.status(200).json({ message: 'payment_required', userId: user._id, token });
    }
  } catch (error) {
    logger.error(`Check user status error: ${error.message}`, { stack: error.stack });
    next(new ErrorHandler(500, 'Server error'));
  }
};

// Resend Email OTP
exports.resendEmailOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors in /resend-email-otp:', { errors: errors.array(), body: req.body });
      return next(new ErrorHandler(400, errors.array()[0].msg));
    }
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`User not found for resend email OTP: ${email}`);
      return next(new ErrorHandler(404, 'user_not_found'));
    }
    const otp = await generateOTP(user._id, 'email');
    await sendEmailOTP(email, otp, user.firstName);
    logger.info(`Email OTP resent to: ${email}, OTP: ${otp}`);
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({ message: 'email_otp_resent', otp });
    }
    res.status(200).json({ message: 'email_otp_resent' });
  } catch (error) {
    logger.error(`Resend email OTP error for ${req.body.email || 'unknown'}: ${error.message}`, { stack: error.stack });
    next(new ErrorHandler(500, 'server_error'));
  }
};

// Resend Phone OTP
exports.resendPhoneOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors in /resend-phone-otp:', { errors: errors.array(), body: req.body });
      return next(new ErrorHandler(400, errors.array()[0].msg));
    }
    const { phone, countryCode } = req.body;
    const cleanPhone = phone.replace(/\s/g, '');
    const user = await User.findOne({ phone: `${countryCode}${cleanPhone}`, countryCode });
    if (!user) {
      logger.warn(`User not found for resend phone OTP: ${phone}`);
      return next(new ErrorHandler(404, 'user_not_found'));
    }
    const otp = await generateOTP(user._id, 'phone');
    await sendSMSOTP(`${countryCode}${cleanPhone}`, otp);
    logger.info(`Phone OTP resent to: ${phone}, OTP: ${otp}`);
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({ message: 'phone_otp_resent', otp });
    }
    res.status(200).json({ message: 'phone_otp_resent' });
  } catch (error) {
    logger.error(`Resend phone OTP error for ${req.body.phone || 'unknown'}: ${error.message}`, { stack: error.stack });
    next(new ErrorHandler(500, 'server_error'));
  }
};

// Setup 2FA
exports.setup2FA = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors in /setup-2fa:', { errors: errors.array(), body: req.body });
      return next(new ErrorHandler(400, errors.array()[0].msg));
    }
    const { userId, enable, code } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`User not found for 2FA setup: ${userId}`);
      return next(new ErrorHandler(404, 'user_not_found'));
    }
    const otpRecord = await OTP.findOne({ user: user._id, type: '2fa', code });
    if (!otpRecord) {
      logger.warn(`No OTP record found for 2FA, userId: ${user._id}, code: ${code}`);
      return next(new ErrorHandler(400, 'invalid_otp', { details: 'no_otp_record' }));
    }
    if (otpRecord.expiresAt < new Date()) {
      logger.warn(`Expired OTP for 2FA, user: ${user.email}, expiresAt: ${otpRecord.expiresAt}`);
      await OTP.deleteOne({ _id: otpRecord._id });
      return next(new ErrorHandler(400, 'otp_expired', { details: 'otp_expired' }));
    }
    user.twoFactorEnabled = enable;
    await user.save();
    await OTP.deleteOne({ _id: otpRecord._id });
    logger.info(`2FA ${enable ? 'enabled' : 'disabled'} for user: ${user.email}`);
    res.status(200).json({ message: '2fa_setup_complete', userId: user._id });
  } catch (error) {
    logger.error(`2FA setup error for userId ${req.body.userId || 'unknown'}: ${error.message}`, { stack: error.stack });
    next(new ErrorHandler(500, 'server_error'));
  }
};

// Resend 2FA OTP
exports.resend2FAOTP = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors in /resend-2fa-otp:', { errors: errors.array(), body: req.body });
      return next(new ErrorHandler(400, errors.array()[0].msg));
    }
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`User not found for resend 2FA OTP: ${userId}`);
      return next(new ErrorHandler(404, 'user_not_found'));
    }
    const otp = await generateOTP(user._id, '2fa');
    await sendEmailOTP(user.email, otp, user.firstName);
    logger.info(`2FA OTP resent to: ${user.email}, OTP: ${otp}`);
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({ message: '2fa_otp_resent', otp });
    }
    res.status(200).json({ message: '2fa_otp_resent' });
  } catch (error) {
    logger.error(`Resend 2FA OTP error for userId ${req.body.userId || 'unknown'}: ${error.message}`, { stack: error.stack });
    next(new ErrorHandler(500, 'server_error'));
  }
};

// Forgot Password
exports.forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors in /forgot-password:', { errors: errors.array(), body: req.body });
      return next(new ErrorHandler(400, errors.array()[0].msg));
    }
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`User not found for password reset: ${email}`);
      return next(new ErrorHandler(404, 'user_not_found'));
    }
    const otp = await generateOTP(user._id, 'password_reset');
    await sendEmailOTP(email, otp, user.firstName);
    logger.info(`Password reset OTP sent to: ${email}, OTP: ${otp}`);
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({ message: 'password_reset_otp_sent', otp });
    }
    res.status(200).json({ message: 'password_reset_otp_sent' });
  } catch (error) {
    logger.error(`Forgot password error for ${req.body.email || 'unknown'}: ${error.message}`, { stack: error.stack });
    next(new ErrorHandler(500, 'server_error'));
  }
};

// Session
exports.session = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      logger.warn(`User not found for ID: ${req.user.id}`);
      return next(new ErrorHandler(404, 'user_not_found'));
    }
    res.json({
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      hasPaidVerificationFee: user.hasPaidVerificationFee,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      twoFactorEnabled: user.twoFactorEnabled,
    });
  } catch (error) {
    logger.error(`Session check error for user ID: ${req.user.id}: ${error.message}`, { stack: error.stack });
    next(new ErrorHandler(500, 'server_error'));
  }
};

// Logout
exports.logout = async (req, res, next) => {
  try {
    logger.info(`User logged out: ${req.user.id}`);
    res.status(200).json({ message: 'logout_success' });
  } catch (error) {
    logger.error(`Logout error for userId ${req.user.id}: ${error.message}`, { stack: error.stack });
    next(new ErrorHandler(500, 'server_error'));
  }
};

// Process Payment Callback
exports.processPaymentCallback = async (req, res, next) => {
  const { method } = req.params;
  const { userId, transactionId, email, name, phoneNumber } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return next(new ErrorHandler(404, 'user_not_found'));

    const paymentResult = await paymentService.verifyPayment({
      gateway: method,
      transactionId,
      userId,
      email,
      name,
      phoneNumber,
      type: 'verification',
    });

    if (!paymentResult.success) {
      return next(new ErrorHandler(400, 'Payment verification failed'));
    }

    user.hasPaidVerificationFee = true;
    await user.save();

    logger.info(`Payment callback processed for user ${userId}, method: ${method}`);
    res.json({ message: 'payment_verified', userId: user._id });
  } catch (error) {
    logger.error(`Payment callback error for userId ${userId}, method ${method}: ${error.message}`, { stack: error.stack });
    next(new ErrorHandler(500, 'server_error'));
  }
};