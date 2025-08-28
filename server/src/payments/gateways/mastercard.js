// src/payments/gateways/mastercard.js
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');
const retry = require('../../utils/retry');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const emailService = require('../../services/emailService');
const smsService = require('../../services/smsService');

const supportedCountries = require('../../utils/constants').paypalSupportedCountries;

function validateCountry(countryCode) {
  if (!supportedCountries.includes(countryCode)) {
    throw new ErrorHandler(400, 'Mastercard not supported in your country');
  }
}

async function sendNotifications(userId, status, amount, currency, transactionId) {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    await emailService.sendPaymentNotification(user.email, status, amount, currency, transactionId);
    await smsService.sendPaymentNotification(`+${user.countryCode}${user.phone}`, status, amount, currency, transactionId);
  } catch (err) {
    logger.error(`Mastercard notification error for user ${userId}: ${err.message}`);
  }
}

exports.processPayment = async (options) => {
  const { amount, currency, details, userId, paymentId } = options;
  validateCountry(details.countryCode);
  if (!details.cardNumber || !details.cvv || !details.expiryMonth || !details.expiryYear) {
    throw new ErrorHandler(400, 'Card details required for Mastercard');
  }

  try {
    // TODO: Integrate with Pesapal or another processor
    const transactionId = `MC-${userId}-${Date.now()}`;
    const payment = await Payment.findById(paymentId);
    if (payment) {
      payment.transactionId = transactionId;
      await payment.save();
    }

    logger.info(`Mastercard payment stub initiated: ${amount} ${currency} for user ${userId}`);
    await sendNotifications(userId, 'initiated', amount, currency, transactionId);
    return { success: true, transactionId, pending: true };
  } catch (err) {
    logger.error(`Mastercard payment error: ${err.message}`);
    throw new ErrorHandler(500, 'Mastercard payment processing failed');
  }
};

exports.capturePayment = async (transactionId, userId, paymentId) => {
  try {
    // TODO: Query transaction status via Pesapal
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new ErrorHandler(404, 'Payment not found');

    logger.info(`Mastercard capture stub: ${transactionId}`);
    payment.status = 'success';
    await payment.save();
    await sendNotifications(userId, 'success', payment.localAmount, payment.currency, transactionId);
    return { success: true, transactionId };
  } catch (err) {
    logger.error(`Mastercard capture error: ${err.message}`);
    throw new ErrorHandler(500, 'Mastercard capture failed');
  }
};

exports.processRefund = async (options) => {
  const { amount, originalTransactionId, userId } = options;

  try {
    // TODO: Implement refund via Pesapal
    logger.info(`Mastercard refund stub: ${amount} USD for ${originalTransactionId}`);
    await sendNotifications(userId, 'success', amount, 'USD', originalTransactionId);
    return { success: true, transactionId: originalTransactionId };
  } catch (err) {
    logger.error(`Mastercard refund error: ${err.message}`);
    throw new ErrorHandler(500, 'Mastercard refund processing failed');
  }
};

exports.processWithdrawal = async (options) => {
  const { amount, currency, details, userId } = options;
  if (!details.accountNumber) throw new ErrorHandler(400, 'Bank account required for Mastercard');

  try {
    // TODO: Implement payout via Pesapal
    const transactionId = `MC-WD-${userId}-${Date.now()}`;
    logger.info(`Mastercard withdrawal stub: ${amount} ${currency} to ${details.accountNumber}`);
    await sendNotifications(userId, 'success', amount, currency, transactionId);
    return { success: true, transactionId };
  } catch (err) {
    logger.error(`Mastercard withdrawal error: ${err.message}`);
    throw new ErrorHandler(500, 'Mastercard payout processing failed');
  }
};

exports.handleCallback = async (payload) => {
  try {
    // TODO: Handle Pesapal webhook
    logger.info(`Mastercard webhook stub: ${JSON.stringify(payload)}`);
    return { success: true, txId: payload.transactionId || 'stub' };
  } catch (err) {
    logger.error(`Mastercard webhook error: ${err.message}`);
    throw new ErrorHandler(500, 'Mastercard webhook processing failed');
  }
};