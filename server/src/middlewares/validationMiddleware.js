
// server/src/middlewares/validationMiddleware.js
const Joi = require('joi');
const ErrorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { paypalUnsupportedCountryCodes } = require('../utils/constants');

// Signup validation
exports.validateSignup = (req, res, next) => {
  const schema = Joi.object({
    firstName: Joi.string().trim().required().messages({
      'string.empty': 'First name is required',
    }),
    secondName: Joi.string().trim().required().messages({
      'string.empty': 'Second name is required',
    }),
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      'string.empty': 'Username is required',
      'string.alphanum': 'Username must contain only letters and numbers',
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username must not exceed 30 characters',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Invalid email address',
      'string.empty': 'Email is required',
    }),
    countryCode: Joi.string()
      .length(2)
      .uppercase() // Fix: Changed upper() to uppercase()
      .invalid(...paypalUnsupportedCountryCodes)
      .required()
      .messages({
        'string.length': 'Country code must be 2 characters',
        'any.invalid': 'Country not supported by PayPal',
        'string.empty': 'Country code is required',
      }),
    phone: Joi.string().pattern(/^\d{9,12}$/).required().messages({
      'string.pattern.base': 'Phone number must be 9-12 digits',
      'string.empty': 'Phone number is required',
    }),
    password: Joi.string()
      .min(8)
      .pattern(/[A-Z]/)
      .pattern(/[0-9]/)
      .pattern(/[!@#$%^&*]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must contain uppercase, number, and special character',
        'string.empty': 'Password is required',
      }),
    referral: Joi.string().allow('').optional().messages({
      'string.base': 'Referral code must be a string',
    }),
    termsAccepted: Joi.boolean().valid(true).required().messages({
      'any.only': 'Terms must be accepted',
    }),
    enable2FA: Joi.boolean().optional().messages({
      'boolean.base': 'Enable 2FA must be a boolean',
    }),
    currency: Joi.string().default('USD').messages({
      'string.base': 'Currency must be a string',
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details[0].message;
    logger.warn(`Validation error in signup: ${errorMessage}`, {
      errors: error.details,
      body: req.body,
    });
    return next(new ErrorHandler(400, errorMessage));
  }
  next();
};

// OTP verification validation
exports.validateVerifyOTPs = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required().messages({
      'string.empty': 'User ID is required',
    }),
    emailOTP: Joi.string().length(6).required().messages({
      'string.length': 'Email OTP must be 6 characters',
      'string.empty': 'Email OTP is required',
    }),
    phoneOTP: Joi.string().length(6).required().messages({
      'string.length': 'Phone OTP must be 6 characters',
      'string.empty': 'Phone OTP is required',
    }),
    paymentGateway: Joi.string().required().messages({
      'string.empty': 'Payment gateway is required',
    }),
    paymentDetails: Joi.object().required().messages({
      'object.base': 'Payment details must be an object',
    }),
    currency: Joi.string().default('USD').messages({
      'string.base': 'Currency must be a string',
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details[0].message;
    logger.warn(`Validation error in verify OTPs: ${errorMessage}`, {
      errors: error.details,
      body: req.body,
    });
    return next(new ErrorHandler(400, errorMessage));
  }
  next();
};

// Login validation
exports.validateLogin = (req, res, next) => {
  const schema = Joi.object({
    usernameOrEmail: Joi.string().required().messages({
      'string.empty': 'Username or email is required',
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password is required',
    }),
    twoFactorCode: Joi.string().length(6).optional().messages({
      'string.length': '2FA code must be 6 characters',
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details[0].message;
    logger.warn(`Validation error in login: ${errorMessage}`, {
      errors: error.details,
      body: req.body,
    });
    return next(new ErrorHandler(400, errorMessage));
  }
  next();
};

// 2FA validation
exports.validate2FA = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required().messages({
      'string.empty': 'User ID is required',
    }),
    twoFAOTP: Joi.string().length(6).required().messages({
      'string.length': '2FA OTP must be 6 characters',
      'string.empty': '2FA OTP is required',
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details[0].message;
    logger.warn(`Validation error in 2FA: ${errorMessage}`, {
      errors: error.details,
      body: req.body,
    });
    return next(new ErrorHandler(400, errorMessage));
  }
  next();
};

// Invest validation
exports.validateInvest = (req, res, next) => {
  const schema = Joi.object({
    planId: Joi.string().required().messages({
      'string.empty': 'Plan ID is required',
    }),
    shares: Joi.number().integer().min(1).required().messages({
      'number.base': 'Shares must be a number',
      'number.min': 'Shares must be at least 1',
      'number.integer': 'Shares must be an integer',
    }),
    paymentGateway: Joi.string().required().messages({
      'string.empty': 'Payment gateway is required',
    }),
    paymentDetails: Joi.object().required().messages({
      'object.base': 'Payment details must be an object',
    }),
    currency: Joi.string().default('USD').messages({
      'string.base': 'Currency must be a string',
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details[0].message;
    logger.warn(`Validation error in invest: ${errorMessage}`, {
      errors: error.details,
      body: req.body,
    });
    return next(new ErrorHandler(400, errorMessage));
  }
  next();
};

// Withdraw validation
exports.validateWithdraw = (req, res, next) => {
  const schema = Joi.object({
    investmentId: Joi.string().required().messages({
      'string.empty': 'Investment ID is required',
    }),
    paymentGateway: Joi.string().required().messages({
      'string.empty': 'Payment gateway is required',
    }),
    paymentDetails: Joi.object().required().messages({
      'object.base': 'Payment details must be an object',
    }),
    currency: Joi.string().default('USD').messages({
      'string.base': 'Currency must be a string',
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details[0].message;
    logger.warn(`Validation error in withdraw: ${errorMessage}`, {
      errors: error.details,
      body: req.body,
    });
    return next(new ErrorHandler(400, errorMessage));
  }
  next();
};

// Comment validation
exports.validateComment = (req, res, next) => {
  const schema = Joi.object({
    text: Joi.string().min(1).max(500).required().messages({
      'string.empty': 'Comment text is required',
      'string.min': 'Comment must be at least 1 character',
      'string.max': 'Comment must not exceed 500 characters',
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details[0].message;
    logger.warn(`Validation error in comment: ${errorMessage}`, {
      errors: error.details,
      body: req.body,
    });
    return next(new ErrorHandler(400, errorMessage));
  }
  next();
};

// Manage comment validation
exports.validateManageComment = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().valid('approved', 'rejected').required().messages({
      'string.empty': 'Status is required',
      'any.only': 'Status must be either approved or rejected',
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details[0].message;
    logger.warn(`Validation error in manage comment: ${errorMessage}`, {
      errors: error.details,
      body: req.body,
    });
    return next(new ErrorHandler(400, errorMessage));
  }
  next();
};

// Update daily limit validation
exports.validateUpdateDailyLimit = (req, res, next) => {
  const schema = Joi.object({
    dailyLimit: Joi.number().integer().min(0).required().messages({
      'number.base': 'Daily limit must be a number',
      'number.min': 'Daily limit must be at least 0',
      'number.integer': 'Daily limit must be an integer',
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details[0].message;
    logger.warn(`Validation error in update daily limit: ${errorMessage}`, {
      errors: error.details,
      body: req.body,
    });
    return next(new ErrorHandler(400, errorMessage));
  }
  next();
};

// Toggle maintenance validation
exports.validateToggleMaintenance = (req, res, next) => {
  const schema = Joi.object({
    maintenance: Joi.boolean().required().messages({
      'boolean.base': 'Maintenance must be a boolean',
      'any.required': 'Maintenance status is required',
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details[0].message;
    logger.warn(`Validation error in toggle maintenance: ${errorMessage}`, {
      errors: error.details,
      body: req.body,
    });
    return next(new ErrorHandler(400, errorMessage));
  }
  next();
};

// Create investment validation (for admin)
exports.validateCreateInvestment = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required().messages({
      'string.empty': 'User ID is required',
    }),
    planId: Joi.string().required().messages({
      'string.empty': 'Plan ID is required',
    }),
    shares: Joi.number().integer().min(1).required().messages({
      'number.base': 'Shares must be a number',
      'number.min': 'Shares must be at least 1',
      'number.integer': 'Shares must be an integer',
    }),
    paymentGateway: Joi.string().required().messages({
      'string.empty': 'Payment gateway is required',
    }),
    paymentDetails: Joi.object().required().messages({
      'object.base': 'Payment details must be an object',
    }),
    currency: Joi.string().default('USD').messages({
      'string.base': 'Currency must be a string',
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details[0].message;
    logger.warn(`Validation error in create investment: ${errorMessage}`, {
      errors: error.details,
      body: req.body,
    });
    return next(new ErrorHandler(400, errorMessage));
  }
  next();
};