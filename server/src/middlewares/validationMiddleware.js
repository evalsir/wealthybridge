const Joi = require('joi');
const ErrorHandler = require('../utils/errorHandler');
const { paypalUnsupportedCountryCodes } = require('../utils/constants');

// Signup validation
exports.validateSignup = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    countryCode: Joi.string().length(2).upper().invalid(...paypalUnsupportedCountryCodes).required(),
    phone: Joi.string().required(),
    password: Joi.string().min(8).required(),
    referralCode: Joi.string().optional(),
    acceptTerms: Joi.boolean().valid(true).required(),
    enable2FA: Joi.boolean().optional(),
    currency: Joi.string().default('USD'),
  });

  const { error } = schema.validate(req.body);
  if (error) return next(new ErrorHandler(400, error.details[0].message));
  next();
};

// OTP verification validation
exports.validateVerifyOTPs = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    emailOTP: Joi.string().required(),
    phoneOTP: Joi.string().required(),
    paymentGateway: Joi.string().required(),
    paymentDetails: Joi.object().required(),
    currency: Joi.string().default('USD'),
  });

  const { error } = schema.validate(req.body);
  if (error) return next(new ErrorHandler(400, error.details[0].message));
  next();
};

// Login validation
exports.validateLogin = (req, res, next) => {
  const schema = Joi.object({
    identifier: Joi.string().required(),
    password: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return next(new ErrorHandler(400, error.details[0].message));
  next();
};

// 2FA validation
exports.validate2FA = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    twoFAOTP: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return next(new ErrorHandler(400, error.details[0].message));
  next();
};

// Invest validation
exports.validateInvest = (req, res, next) => {
  const schema = Joi.object({
    planId: Joi.string().required(),
    shares: Joi.number().integer().min(1).required(),
    paymentGateway: Joi.string().required(),
    paymentDetails: Joi.object().required(),
    currency: Joi.string().default('USD'),
  });

  const { error } = schema.validate(req.body);
  if (error) return next(new ErrorHandler(400, error.details[0].message));
  next();
};

// Withdraw validation
exports.validateWithdraw = (req, res, next) => {
  const schema = Joi.object({
    investmentId: Joi.string().required(),
    paymentGateway: Joi.string().required(),
    paymentDetails: Joi.object().required(),
    currency: Joi.string().default('USD'),
  });

  const { error } = schema.validate(req.body);
  if (error) return next(new ErrorHandler(400, error.details[0].message));
  next();
};

// Comment validation
exports.validateComment = (req, res, next) => {
  const schema = Joi.object({
    text: Joi.string().min(1).max(500).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return next(new ErrorHandler(400, error.details[0].message));
  next();
};

// Manage comment validation
exports.validateManageComment = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return next(new ErrorHandler(400, error.details[0].message));
  next();
};

// Update daily limit validation
exports.validateUpdateDailyLimit = (req, res, next) => {
  const schema = Joi.object({
    dailyLimit: Joi.number().integer().min(0).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return next(new ErrorHandler(400, error.details[0].message));
  next();
};

// Toggle maintenance validation
exports.validateToggleMaintenance = (req, res, next) => {
  const schema = Joi.object({
    maintenance: Joi.boolean().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return next(new ErrorHandler(400, error.details[0].message));
  next();
};

// Create investment validation (for admin)
exports.validateCreateInvestment = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    planId: Joi.string().required(),
    shares: Joi.number().integer().min(1).required(),
    paymentGateway: Joi.string().required(),
    paymentDetails: Joi.object().required(),
    currency: Joi.string().default('USD'),
  });

  const { error } = schema.validate(req.body);
  if (error) return next(new ErrorHandler(400, error.details[0].message));
  next();
};