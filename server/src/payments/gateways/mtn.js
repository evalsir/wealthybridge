// src/payments/gateways/mtn.js: MTN Mobile Money stub.

const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');
const emailService = require('../../services/emailService');
const smsService = require('../../services/smsService');
const User = require('../../models/User');

async function sendNotifications(userId, status, amount, currency, transactionId) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    await emailService.sendPaymentNotification(user.email, status, amount, currency, transactionId);
    await smsService.sendPaymentNotification(`+${user.countryCode}${user.phone}`, status, amount, currency, transactionId);
  } catch (err) {
    logger.error(`MTN notification error for user ${userId}: ${err.message}`);
  }
}

exports.processPayment = async (options) => {
  const { amount, currency, details, userId, paymentId } = options;
  if (!details.phone) throw new ErrorHandler(400, 'Phone number required for MTN');

  // TODO: Integrate MTN MoMo API (https://momo.mtn.com)
  logger.info(`MTN payment stub: ${amount} ${currency} for user ${userId}`);
  const transactionId = `MTN-${userId}-${Date.now()}`;
  await sendNotifications(userId, 'initiated', amount, currency, transactionId);
  return { success: true, transactionId, pending: true };
};

exports.capturePayment = async (transactionId, userId, paymentId) => {
  // TODO: Query MTN MoMo transaction status
  logger.info(`MTN capture stub: ${transactionId}`);
  await sendNotifications(userId, 'success', 0, 'USD', transactionId);
  return { success: true, transactionId };
};

exports.processRefund = async (options) => {
  const { amount, originalTransactionId, userId } = options;
  // TODO: Implement MTN MoMo refund
  logger.info(`MTN refund stub: ${amount} USD for ${originalTransactionId}`);
  await sendNotifications(userId, 'success', amount, 'USD', originalTransactionId);
  return { success: true, transactionId: originalTransactionId };
};

exports.processWithdrawal = async (options) => {
  const { amount, currency, details, userId } = options;
  if (!details.phone) throw new ErrorHandler(400, 'Phone number required for MTN');
  // TODO: Implement MTN MoMo disbursement
  logger.info(`MTN withdrawal stub: ${amount} ${currency} to ${details.phone}`);
  const transactionId = `MTN-WD-${userId}-${Date.now()}`;
  await sendNotifications(userId, 'success', amount, currency, transactionId);
  return { success: true, transactionId };
};

exports.handleCallback = async (payload) => {
  // TODO: Handle MTN MoMo webhook
  logger.info(`MTN webhook stub: ${JSON.stringify(payload)}`);
  return { success: true, txId: payload.transactionId || 'stub' };
};