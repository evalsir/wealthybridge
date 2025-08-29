// src/services/paymentService.js
const Payment = require('../models/Payment');
const gateways = require('../payments');
const currencyService = require('./currencyService');
const ErrorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');
const Investment = require('../models/Investment');
const User = require('../models/User'); // Added: For referral bonus
const Referral = require('../models/Referral'); // Added: For referral bonus
const emailService = require('./emailService'); // Added: For notifications
const smsService = require('./smsService'); // Added: For notifications

// Process payment with currency conversion
exports.processPayment = async (options) => {
  try {
    const rate = await currencyService.getRate(options.currency);
    const localAmount = options.amount * rate;

    const payment = new Payment({
      user: options.userId,
      amount: options.amount, // USD
      localAmount,
      currency: options.currency,
      gateway: options.gateway,
      type: options.type,
      status: 'pending',
      details: options.details,
      plan: options.planId,
      shares: options.shares,
    });

    await payment.save();

    const gatewayOptions = { ...options, amount: localAmount };
    const result = await gateways.processPayment(gatewayOptions);
    if (!result.success) throw new Error('Gateway payment failed');

    payment.status = 'success';
    payment.transactionId = result.transactionId;
    await payment.save();

    logger.info(`Payment processed: ${options.type} for ${options.amount} USD (${localAmount} ${options.currency})`);
    return { success: true, transactionId: result.transactionId, localAmount };
  } catch (err) {
    logger.error(`Payment process error: ${err.message}`);
    throw new ErrorHandler(500, 'Payment error');
  }
};

// Process refund
exports.processRefund = async (options) => {
  try {
    const rate = await currencyService.getRate(options.currency || 'USD');
    const localAmount = options.amount * rate;

    const payment = new Payment({
      user: options.userId,
      amount: options.amount,
      localAmount,
      currency: options.currency || 'USD',
      gateway: options.gateway,
      type: 'refund',
      status: 'pending',
      details: options.details,
    });

    await payment.save();

    const result = await gateways.processRefund({ ...options, amount: localAmount });
    if (!result.success) throw new Error('Gateway refund failed');

    payment.status = 'success';
    payment.transactionId = result.transactionId;
    await payment.save();

    logger.info(`Refund processed: ${options.amount} USD (${localAmount} ${options.currency})`);
    return { success: true, transactionId: result.transactionId, localAmount };
  } catch (err) {
    logger.error(`Refund process error: ${err.message}`);
    throw new ErrorHandler(500, 'Refund error');
  }
};

// Process withdrawal
exports.processWithdrawal = async (options) => {
  try {
    const rate = await currencyService.getRate(options.currency);
    const localAmount = options.amount * rate;

    const payment = new Payment({
      user: options.userId,
      amount: options.amount,
      localAmount,
      currency: options.currency,
      gateway: options.gateway,
      type: 'withdrawal',
      status: 'pending',
      details: options.details,
    });

    await payment.save();

    const result = await gateways.processWithdrawal({ ...options, amount: localAmount });
    if (!result.success) throw new Error('Gateway withdrawal failed');

    payment.status = 'success';
    payment.transactionId = result.transactionId;
    await payment.save();

    logger.info(`Withdrawal processed: ${options.amount} USD (${localAmount} ${options.currency})`);
    return { success: true, transactionId: result.transactionId, localAmount };
  } catch (err) {
    logger.error(`Withdrawal process error: ${err.message}`);
    throw new ErrorHandler(500, 'Withdrawal error');
  }
};

// Handle gateway callback
exports.handleCallback = async (gateway, payload) => {
  try {
    const result = await gateways.handleCallback(gateway, payload);
    if (result.success) {
      const payment = await Payment.findOne({ transactionId: payload.txId }); // Assume payload has txId
      if (payment) {
        payment.status = 'success';
        await payment.save();
        logger.info(`Callback updated payment ${payload.txId} to success`);
      }
    }
    return result;
  } catch (err) {
    logger.error(`Callback error for gateway ${gateway}: ${err.message}`);
    throw new ErrorHandler(500, 'Callback error');
  }
};

// Added: Handle referral bonus logic
exports.handleReferralBonus = async (paymentId) => {
  try {
    const payment = await Payment.findById(paymentId).populate('user');
    if (!payment || payment.status !== 'success') {
      logger.info(`No referral bonus for payment ${paymentId}: invalid payment`);
      return;
    }

    const referral = await Referral.findOne({ referred: payment.user._id, status: 'pending' });
    if (!referral) {
      logger.info(`No referral bonus for payment ${paymentId}: no pending referral`);
      return;
    }

    const bonusPercent = parseFloat(process.env.REFERRAL_BONUS_PERCENT) || 4;
    const bonusAmount = (payment.amount * bonusPercent) / 100;

    referral.bonusAmount = bonusAmount;
    referral.status = 'completed';
    await referral.save();

    const referrer = await User.findById(referral.referrer);
    if (referrer) {
      referrer.balance = (referrer.balance || 0) + bonusAmount;
      await referrer.save();
      await emailService.sendBonusNotification(referrer.email, bonusAmount, payment.currency);
      await smsService.sendBonusNotification(`+${referrer.countryCode}${referrer.phone}`, bonusAmount, payment.currency);
      logger.info(`Referral bonus applied: ${bonusAmount} ${payment.currency} for referrer ${referral.referrer}`);
    }
  } catch (err) {
    logger.error(`Referral bonus error for payment ${paymentId}: ${err.message}`);
    throw new ErrorHandler(500, 'Referral bonus error');
  }
};