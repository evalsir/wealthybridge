// src/payments/gateways/flutterwave.js
const fetch = require('node-fetch');
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');
const retry = require('../../utils/retry');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const emailService = require('../../services/emailService');
const smsService = require('../../services/smsService');

const supportedCountries = ['KE', 'UG', 'TZ', 'GH', 'NG', 'RW', 'ZM', 'MW'];

function validateCountry(countryCode) {
  if (!supportedCountries.includes(countryCode)) {
    throw new ErrorHandler(400, 'Flutterwave not supported in your country');
  }
}

function getNetwork(gateway) {
  const networks = {
    mtn: 'MTN',
    tigopesa: 'AIRTELTIGO', // Tigo Pesa is AirtelTigo in Ghana
    airtelmoney: 'AIRTEL',
  };
  return networks[gateway] || 'UNKNOWN';
}

async function sendNotifications(userId, status, amount, currency, transactionId) {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    await emailService.sendPaymentNotification(user.email, status, amount, currency, transactionId);
    await smsService.sendPaymentNotification(`+${user.countryCode}${user.phone}`, status, amount, currency, transactionId);
  } catch (err) {
    logger.error(`Flutterwave notification error for user ${userId}: ${err.message}`);
  }
}

exports.processPayment = async (options) => {
  const { amount, currency, details, userId, paymentId, gateway } = options;
  validateCountry(details.countryCode);
  if (!details.phone) throw new ErrorHandler(400, 'Phone number required for mobile money');

  try {
    const user = await User.findById(userId);
    const transactionId = `FLW-${userId}-${Date.now()}`;
    const payload = {
      tx_ref: transactionId,
      amount: Math.round(amount),
      currency,
      payment_type: 'mobilemoney',
      country: details.countryCode,
      email: user.email,
      phone_number: details.phone,
      network: getNetwork(gateway),
      redirect_url: process.env.FLUTTERWAVE_WEBHOOK_URL,
      meta: { userId, paymentId },
    };

    const response = await retry.retryOperation(() =>
      fetch('https://api.flutterwave.com/v3/charges?type=mobilemoney', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).then(res => res.json())
    );

    if (response.status !== 'success') {
      logger.error(`Flutterwave payment failed: ${JSON.stringify(response)}`);
      return { success: false };
    }

    const payment = await Payment.findById(paymentId);
    if (payment) {
      payment.transactionId = transactionId;
      await payment.save();
    }

    logger.info(`Flutterwave ${gateway} payment initiated: ${amount} ${currency} for user ${userId}`);
    await sendNotifications(userId, 'initiated', amount, currency, transactionId);
    return { success: true, transactionId, pending: true };
  } catch (err) {
    logger.error(`Flutterwave ${gateway} payment error: ${err.message}`);
    throw new ErrorHandler(500, `Flutterwave ${gateway} payment processing failed`);
  }
};

exports.capturePayment = async (transactionId, userId, paymentId) => {
  try {
    const response = await retry.retryOperation(() =>
      fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
        headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` },
      }).then(res => res.json())
    );

    const payment = await Payment.findById(paymentId);
    if (!payment) throw new ErrorHandler(404, 'Payment not found');

    if (response.status === 'success' && response.data.status === 'successful') {
      payment.status = 'success';
      await payment.save();
      await sendNotifications(userId, 'success', payment.localAmount, payment.currency, transactionId);
      logger.info(`Flutterwave payment captured: ${transactionId}`);
      return { success: true, transactionId };
    } else {
      payment.status = 'failed';
      await payment.save();
      await sendNotifications(userId, 'failed', payment.localAmount, payment.currency, transactionId);
      logger.error(`Flutterwave capture failed: ${response.data.status}`);
      return { success: false };
    }
  } catch (err) {
    logger.error(`Flutterwave capture error: ${err.message}`);
    throw new ErrorHandler(500, 'Flutterwave capture failed');
  }
};

exports.processRefund = async (options) => {
  const { amount, originalTransactionId, userId } = options;

  try {
    const response = await retry.retryOperation(() =>
      fetch('https://api.flutterwave.com/v3/transactions/refund', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: originalTransactionId, amount: Math.round(amount) }),
      }).then(res => res.json())
    );

    if (response.status !== 'success') {
      logger.error(`Flutterwave refund failed: ${JSON.stringify(response)}`);
      return { success: false };
    }

    logger.info(`Flutterwave refund processed: ${amount} USD for ${originalTransactionId}`);
    await sendNotifications(userId, 'success', amount, 'USD', response.data.id || originalTransactionId);
    return { success: true, transactionId: response.data.id || originalTransactionId };
  } catch (err) {
    logger.error(`Flutterwave refund error: ${err.message}`);
    throw new ErrorHandler(500, 'Flutterwave refund processing failed');
  }
};

exports.processWithdrawal = async (options) => {
  const { amount, currency, details, userId, gateway } = options;
  if (!details.phone) throw new ErrorHandler(400, 'Phone number required for mobile money');

  try {
    const transactionId = `FLW-WD-${userId}-${Date.now()}`;
    const payload = {
      account_bank: getNetwork(gateway),
      account_number: details.phone,
      amount: Math.round(amount),
      currency,
      narration: 'WealthyBridge Withdrawal',
      reference: transactionId,
    };

    const response = await retry.retryOperation(() =>
      fetch('https://api.flutterwave.com/v3/transfers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).then(res => res.json())
    );

    if (response.status !== 'success') {
      logger.error(`Flutterwave withdrawal failed: ${JSON.stringify(response)}`);
      return { success: false };
    }

    logger.info(`Flutterwave ${gateway} withdrawal initiated: ${amount} ${currency} to ${details.phone}`);
    await sendNotifications(userId, 'success', amount, currency, transactionId);
    return { success: true, transactionId };
  } catch (err) {
    logger.error(`Flutterwave ${gateway} withdrawal error: ${err.message}`);
    throw new ErrorHandler(500, 'Flutterwave withdrawal processing failed');
  }
};

exports.handleCallback = async (payload) => {
  try {
    const { status, tx_ref, transaction_id } = payload;
    const payment = await Payment.findOne({ transactionId: tx_ref });
    if (!payment) throw new ErrorHandler(404, 'Payment not found');

    if (status === 'successful') {
      payment.status = 'success';
      await payment.save();
      await sendNotifications(payment.user, 'success', payment.localAmount, payment.currency, tx_ref);
      logger.info(`Flutterwave webhook processed: ${tx_ref} success`);
      return { success: true, txId: tx_ref };
    } else {
      payment.status = 'failed';
      await payment.save();
      await sendNotifications(payment.user, 'failed', payment.localAmount, payment.currency, tx_ref);
      logger.info(`Flutterwave webhook processed: ${tx_ref} failed`);
      return { success: false, txId: tx_ref };
    }
  } catch (err) {
    logger.error(`Flutterwave webhook error: ${err.message}`);
    throw new ErrorHandler(500, 'Flutterwave webhook processing failed');
  }
};