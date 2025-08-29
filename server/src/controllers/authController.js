// server/src/controllers/authController.js
const User = require('../models/User');
const OTP = require('../models/OTP');
const otpService = require('../services/otpService');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const paymentService = require('../services/paymentService');
const { generateReferralCode, paypalUnsupportedCountryCodes } = require('../utils/constants');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
  const {
    firstName,
    secondName,           // incoming field from client
    username,
    email,
    countryCode,
    phoneCountryCode,     // dialing code e.g. +254 (client should send this)
    phone,
    password,
    referralCode,
    termsAccepted,        // incoming field from client
    enable2FA,
    currency = 'USD',
  } = req.body;

  try {
    // Validation expected to be handled by Joi middleware; keep defensive checks here.

    if (!termsAccepted) return next(new ErrorHandler(400, 'Must accept terms and conditions'));

    // FIXED: defensive check before toUpperCase (countryCode might be undefined)
    if (countryCode && paypalUnsupportedCountryCodes.includes(countryCode.toUpperCase())) {
      return next(new ErrorHandler(400, 'Country not supported by PayPal'));
    }

    // FIXED: normalize phone (remove spaces) before searching/saving
    const normalizedPhone = (phone || '').replace(/\s/g, '');

    // FIXED: compose searchPhone using phoneCountryCode if provided, otherwise fallback to raw phone
    const searchPhone = phoneCountryCode ? `${phoneCountryCode}${normalizedPhone}` : normalizedPhone;

    // FIXED: Check for existing user by username, email, or phone (composed)
    let user = await User.findOne({
      $or: [{ username }, { email }, { phone: searchPhone }],
    });

    if (user) {
      const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      });
      return res.status(400).json({ message: 'user_exists', userId: user._id, token });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const uniqueReferralCode = generateReferralCode();

    // FIXED: Map incoming secondName -> lastName and termsAccepted -> acceptTerms
    // These fields matched the Mongoose model from your logs (acceptTerms, lastName).
    user = new User({
      firstName,
      lastName: secondName, // FIXED: previously saved as secondName but model expects lastName
      name: `${firstName} ${secondName}`,
      username,
      email,
      countryCode: countryCode ? countryCode.toUpperCase() : undefined, // ISO code (optional)
      phone: phoneCountryCode ? `${phoneCountryCode}${normalizedPhone}` : normalizedPhone, // FIXED: store full phone if dial code supplied
      password: hashedPassword,
      referralCode: uniqueReferralCode,
      referredBy: referralCode || null,
      acceptTerms: !!termsAccepted, // FIXED: model uses acceptTerms per error logs
      enable2FA: !!enable2FA,
    });

    await user.save();

    // Send email OTP
    const emailOTP = await generateOTP(user._id, 'email');
    await sendEmailOTP(email, emailOTP, firstName);
    user.emailOTP = emailOTP;
    user.emailOTPExpires = Date.now() + 10 * 60 * 1000;

    // Send phone OTP
    const phoneOTP = await generateOTP(user._id, 'phone');
    // FIXED: send to stored user.phone which contains the dialing code when available
    await sendSMSOTP(user.phone, phoneOTP);
    user.phoneOTP = phoneOTP;
    user.phoneOTPExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    logger.info(`User signup initiated for ${username}. OTPs sent. phone=${user.phone}, countryCode=${user.countryCode}`);
    res.status(201).json({ message: 'email_otp_resent', userId: user._id, token });
  } catch (err) {
    logger.error(`Signup error for ${username || email}: ${err.message}`, { stack: err.stack, body: req.body });
    next(new ErrorHandler(500, 'Server error during signup'));
  }
};

// Verify OTPs and charge verification fee
/**
 * Verify Email OTP (Step 1)
 */
exports.verifyEmailOTP = async (req, res) => {
  try {
    const { userId, emailOTP } = req.body;

    if (!userId || !emailOTP) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Find email OTP
    const emailOTPDoc = await OTP.findOne({ user: userId, type: 'email', otp: emailOTP });
    if (!emailOTPDoc) {
      return res.status(400).json({ error: 'invalid_email_otp' });
    }

    // Check expiry
    if (emailOTPDoc.expiresAt < new Date()) {
      await emailOTPDoc.deleteOne();
      return res.status(400).json({ error: 'email_otp_expired' });
    }

    // Mark email verified
    user.emailVerified = true;
    await user.save();

    // Delete used OTP
    await emailOTPDoc.deleteOne();

    return res.status(200).json({
      message: 'email_verified',
      userId: user._id,
      nextStep: 'phone_otp'
    });
  } catch (error) {
    logger.error(`Verify Email OTP error: ${error.message}`);
    return res.status(500).json({ error: 'Server error' });
  }
};


/**
 * Verify Phone OTP (Step 2)
 */
exports.verifyPhoneOTP = async (req, res) => {
  try {
    const { userId, phoneOTP, paymentGateway, paymentDetails, currency } = req.body;

    if (!userId || !phoneOTP) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.emailVerified) {
      return res.status(400).json({ error: 'email_not_verified' });
    }

    // Find phone OTP
    const phoneOTPDoc = await OTP.findOne({ user: userId, type: 'phone', otp: phoneOTP });
    if (!phoneOTPDoc) {
      return res.status(400).json({ error: 'invalid_phone_otp' });
    }

    // Check expiry
    if (phoneOTPDoc.expiresAt < new Date()) {
      await phoneOTPDoc.deleteOne();
      return res.status(400).json({ error: 'phone_otp_expired' });
    }

    // Mark phone verified
    user.phoneVerified = true;
    await user.save();

    // Delete used OTP
    await phoneOTPDoc.deleteOne();

    // Handle payment if not already paid
    if (!user.paymentStatus || user.paymentStatus !== 'completed') {
      const paymentResult = await handlePayment(user, paymentGateway, paymentDetails, currency);
      if (!paymentResult.success) {
        return res.status(400).json({ error: 'payment_failed', details: paymentResult.message });
      }
    }

    return res.status(200).json({
      message: 'user_verified',
      userId: user._id
    });
  } catch (error) {
    logger.error(`Verify Phone OTP error: ${error.message}`);
    return res.status(500).json({ error: 'Server error' });
  }
};


// Login
exports.login = async (req, res, next) => {
  const { usernameOrEmail: identifier, password, twoFactorCode } = req.body;

  try {
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

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
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
    const user = await User.findById(userId);
    if (!user) return next(new ErrorHandler(404, 'User not found'));

    const otpRecord = await OTP.findOne({ user: user._id, type: '2fa', code: twoFAOTP });
    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return next(new ErrorHandler(400, 'Invalid or expired 2FA OTP'));
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    logger.info(`User ${user.username} 2FA verified successfully`);
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    logger.error(`2FA verification error for userId ${userId}: ${err.message}`, { stack: err.stack });
    next(new ErrorHandler(500, 'Server error during 2FA verification'));
  }
};

// Check User
exports.checkUser = async (req, res, next) => {
  try {
    // FIXED: accept both phoneCountryCode (dial code) and countryCode (ISO) from client
    const { email, phone, phoneCountryCode, countryCode } = req.body;
    if (!email && !phone) {
      return next(new ErrorHandler(400, 'Email or phone is required'));
    }

    const query = {};
    if (email) query.email = email;

    if (phone) {
      const cleanPhone = phone.replace(/\s/g, '');
      if (phoneCountryCode) {
        // FIXED: prefer explicit dial code if provided by client
        query.phone = `${phoneCountryCode}${cleanPhone}`;
      } else {
        // FIXED: fallback: try direct match or phones ending with the provided raw number
        // (useful when client omitted the dial code)
        query.$or = [{ phone: cleanPhone }, { phone: { $regex: `${cleanPhone}$` } }];
      }
    }

    const user = await User.findOne(query);
    if (!user) {
      logger.info(`User not found for email: ${email}, phone: ${phoneCountryCode || ''}${phone || ''}, country: ${countryCode || ''}`);
      return res.status(404).json({ message: 'user_not_found' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

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
      // FIXED: send to stored user.phone (which includes dial code if previously saved)
      await sendSMSOTP(user.phone, phoneOTP);
      return res.status(200).json({ message: 'phone_otp_resent', userId: user._id, token });
    }
    if (!user.hasPaidVerificationFee) {
      return res.status(200).json({ message: 'payment_required', userId: user._id, token });
    }

    // Defensive fallback
    return res.status(200).json({ message: 'unknown_state', userId: user._id, token });
  } catch (error) {
    logger.error(`Check user error: ${error.message}`, { stack: error.stack, body: req.body });
    next(new ErrorHandler(500, 'Server error'));
  }
};

// Resend Email OTP
exports.resendEmailOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`User not found for resend email OTP: ${email}`);
      return next(new ErrorHandler(404, 'user_not_found'));
    }
    const otp = await generateOTP(user._id, 'email');
    await sendEmailOTP(email, otp, user.firstName);
    logger.info(`Email OTP resent to: ${email}` + (process.env.NODE_ENV === 'development' ? `, OTP: ${otp}` : ''));
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
    const { phone, phoneCountryCode } = req.body;
    if (!phone) return next(new ErrorHandler(400, 'Phone is required'));

    const cleanPhone = phone.replace(/\s/g, '');
    let user;

    if (phoneCountryCode) {
      // FIXED: direct lookup when dial code supplied
      user = await User.findOne({ phone: `${phoneCountryCode}${cleanPhone}` });
    } else {
      // FIXED: fallback lookup by exact or suffix match
      user = await User.findOne({ $or: [{ phone: cleanPhone }, { phone: { $regex: `${cleanPhone}$` } }] });
    }

    if (!user) {
      logger.warn(`User not found for resend phone OTP: ${phone}`);
      return next(new ErrorHandler(404, 'user_not_found'));
    }
    const otp = await generateOTP(user._id, 'phone');
    // FIXED: send to stored user.phone to ensure correct dialing code
    await sendSMSOTP(user.phone, otp);
    logger.info(`Phone OTP resent to: ${user.phone}` + (process.env.NODE_ENV === 'development' ? `, OTP: ${otp}` : ''));
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
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`User not found for resend 2FA OTP: ${userId}`);
      return next(new ErrorHandler(404, 'user_not_found'));
    }
    const otp = await generateOTP(user._id, '2fa');
    await sendEmailOTP(user.email, otp, user.firstName);
    logger.info(`2FA OTP resent to: ${user.email}` + (process.env.NODE_ENV === 'development' ? `, OTP: ${otp}` : ''));
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
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`User not found for password reset: ${email}`);
      return next(new ErrorHandler(404, 'user_not_found'));
    }
    const otp = await generateOTP(user._id, 'password_reset');
    await sendEmailOTP(email, otp, user.firstName);
    logger.info(`Password reset OTP sent to: ${email}` + (process.env.NODE_ENV === 'development' ? `, OTP: ${otp}` : ''));
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
