const Payment = require('../models/Payment');
const gateways = require('../payments');
const currencyService = require('./currencyService');
const ErrorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');
const Investment = require('../models/Investment');

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