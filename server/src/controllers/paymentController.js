// src/controllers/paymentController.js
const Payment = require('../models/Payment');
const paymentService = require('../services/paymentService');
const ErrorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');

const processPayment = async (req, res, next) => {
  try {
    const { amount, currency, gateway, transactionId } = req.body;
    const userId = req.user._id;

    if (!amount || !currency || !gateway) {
      throw new ErrorHandler(400, 'Missing required payment fields');
    }

    const payment = new Payment({
      user: userId,
      amount,
      localAmount: amount, // Adjust based on currency conversion logic
      currency,
      gateway,
      transactionId,
      status: 'pending', // Initial status
    });

    await payment.save();
    logger.info(`Payment initiated: ${transactionId} for user ${userId}`);

    const result = await paymentService.initiatePayment(gateway, { amount, currency, transactionId, userId });
    if (!result.success) {
      payment.status = 'failed';
      await payment.save();
      throw new ErrorHandler(400, 'Payment initiation failed');
    }

    payment.status = 'success';
    await payment.save();

    // Modified: Use paymentService for referral bonus
    await paymentService.handleReferralBonus(payment._id);

    res.json({ success: true, paymentId: payment._id, ...result });
  } catch (err) {
    logger.error(`Payment processing error: ${err.message}`);
    next(err);
  }
};

const capturePayment = async (req, res, next) => {
  const { transactionId, gateway } = req.body;
  const userId = req.user._id;

  try {
    const payment = await Payment.findOne({ transactionId, user: userId });
    if (!payment) return next(new ErrorHandler(404, 'Payment not found'));

    const result = await paymentService.capturePayment(gateway, transactionId, userId, payment._id);
    payment.status = result.success ? 'success' : 'failed';
    await payment.save();

    if (result.success) {
      // Modified: Use paymentService for referral bonus
      await paymentService.handleReferralBonus(payment._id);
    }

    res.json({ message: 'Payment captured', ...result });
  } catch (err) {
    logger.error(`Payment capture error: ${err.message}`);
    next(err);
  }
};

const paymentCallback = async (req, res, next) => {
  const { gateway } = req.params;
  const payload = req.body;

  try {
    const result = await paymentService.handleCallback(gateway, payload);
    if (!result.success) return next(new ErrorHandler(400, 'Payment callback failed'));

    logger.info(`Payment callback processed for gateway ${gateway}`);
    res.json({ message: 'Callback processed successfully' });
  } catch (err) {
    logger.error(`Payment callback error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error during payment callback'));
  }
};

module.exports = {
  processPayment,
  capturePayment,
  paymentCallback
};

// Debug exports
console.log('paymentController exports:', module.exports);