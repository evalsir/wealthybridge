// src/payments/gateways/airtelmoney.js
const axios = require('axios');
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');
const retry = require('../../utils/retry');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const emailService = require('../../services/emailService');
const smsService = require('../../services/smsService');

const AIRTEL_MONEY_API_URL = 'https://api.airtelmoney.ke/v1'; // Hypothetical sandbox API
const supportedCountries = ['KE']; // Airtel Money for Kenya

function validateCountry(countryCode) {
  if (!supportedCountries.includes(countryCode)) {
    throw new ErrorHandler(400, 'Airtel Money not supported in your country');
  }
}

async function sendNotifications(userId, status, amount, currency, transactionId) {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    await emailService.sendPaymentNotification(user.email, status, amount, currency, transactionId);
    await smsService.sendPaymentNotification(`+${user.countryCode}${user.phone}`, status, amount, currency, transactionId);
  } catch (err) {
    logger.error(`Airtel Money notification error for user ${userId}: ${err.message}`);
  }
}

exports.processPayment = async (options) => {
  const { amount, currency, details, userId, paymentId } = options;
  validateCountry(details.countryCode);
  if (!details.phoneNumber) {
    throw new ErrorHandler(400, 'Phone number required for Airtel Money');
  }

  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new ErrorHandler(404, 'Payment not found');

    const response = await retry.retryOperation(() =>
      axios.post(
        `${AIRTEL_MONEY_API_URL}/payments`,
        {
          amount: Math.round(amount),
          currency,
          phoneNumber: details.phoneNumber,
          shortCode: process.env.AIRTEL_MONEY_SHORTCODE,
          reference: paymentId,
          callbackUrl: process.env.AIRTEL_MONEY_CALLBACK_URL,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.AIRTEL_MONEY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )
    );

    const transactionId = response.data.transactionId;
    payment.transactionId = transactionId;
    payment.status = 'pending';
    await payment.save();

    logger.info(`Airtel Money payment initiated: ${amount} ${currency} for user ${userId}`);
    await sendNotifications(userId, 'initiated', amount, currency, transactionId);
    return {
      success: true,
      transactionId,
      pending: true,
    };
  } catch (err) {
    logger.error(`Airtel Money payment error: ${err.message}`);
    throw new ErrorHandler(500, 'Airtel Money payment processing failed');
  }
};

exports.capturePayment = async (transactionId, userId, paymentId) => {
  try {
    const response = await retry.retryOperation(() =>
      axios.get(`${AIRTEL_MONEY_API_URL}/transactions/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${process.env.AIRTEL_MONEY_API_KEY}`,
        },
      })
    );

    const payment = await Payment.findById(paymentId);
    if (!payment) throw new ErrorHandler(404, 'Payment not found');

    if (response.data.status === 'SUCCESS') {
      payment.status = 'success';
      await payment.save();
      await sendNotifications(userId, 'success', payment.localAmount, payment.currency, transactionId);
      logger.info(`Airtel Money payment captured: ${transactionId}`);
      return { success: true, transactionId };
    } else if (response.data.status === 'PENDING') {
      logger.info(`Airtel Money payment pending: ${transactionId}`);
      return { success: true, transactionId, pending: true };
    } else {
      payment.status = 'failed';
      await payment.save();
      await sendNotifications(userId, 'failed', payment.localAmount, payment.currency, transactionId);
      logger.error(`Airtel Money capture failed: ${response.data.status}`);
      return { success: false };
    }
  } catch (err) {
    logger.error(`Airtel Money capture error: ${err.message}`);
    throw new ErrorHandler(500, 'Airtel Money capture failed');
  }
};

exports.processRefund = async (options) => {
  const { amount, originalTransactionId, userId } = options;

  try {
    const response = await retry.retryOperation(() =>
      axios.post(
        `${AIRTEL_MONEY_API_URL}/refunds`,
        {
          amount: Math.round(amount),
          transactionId: originalTransactionId,
          shortCode: process.env.AIRTEL_MONEY_SHORTCODE,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.AIRTEL_MONEY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )
    );

    const refundId = response.data.refundId;
    logger.info(`Airtel Money refund processed: ${amount} USD for ${originalTransactionId}`);
    await sendNotifications(userId, 'success', amount, 'USD', refundId);
    return { success: true, transactionId: refundId };
  } catch (err) {
    logger.error(`Airtel Money refund error: ${err.message}`);
    throw new ErrorHandler(500, 'Airtel Money refund processing failed');
  }
};

exports.processWithdrawal = async (options) => {
  const { amount, currency, details, userId } = options;
  if (!details.phoneNumber) throw new ErrorHandler(400, 'Phone number required for Airtel Money');

  try {
    const response = await retry.retryOperation(() =>
      axios.post(
        `${AIRTEL_MONEY_API_URL}/payouts`,
        {
          amount: Math.round(amount),
          currency,
          phoneNumber: details.phoneNumber,
          shortCode: process.env.AIRTEL_MONEY_SHORTCODE,
          reference: `WD-${userId}-${Date.now()}`,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.AIRTEL_MONEY_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )
    );

    const transactionId = response.data.transactionId;
    logger.info(`Airtel Money withdrawal initiated: ${amount} ${currency} to ${details.phoneNumber}`);
    await sendNotifications(userId, 'success', amount, currency, transactionId);
    return { success: true, transactionId };
  } catch (err) {
    logger.error(`Airtel Money withdrawal error: ${err.message}`);
    throw new ErrorHandler(500, 'Airtel Money payout processing failed');
  }
};

exports.handleCallback = async (payload) => {
  try {
    const { transactionId, status, paymentId } = payload.body;
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new ErrorHandler(404, 'Payment not found');

    let success;
    if (status === 'SUCCESS') {
      payment.status = 'success';
      success = true;
      await payment.save();
      await sendNotifications(payment.user, 'success', payment.localAmount, payment.currency, transactionId);
    } else if (status === 'FAILED') {
      payment.status = 'failed';
      success = false;
      await payment.save();
      await sendNotifications(payment.user, 'failed', payment.localAmount, payment.currency, transactionId);
    } else {
      logger.warn(`Unhandled Airtel Money webhook status: ${status}`);
      return { success: false };
    }

    logger.info(`Airtel Money webhook processed: ${status} for ${transactionId}`);
    return { success, txId: transactionId };
  } catch (err) {
    logger.error(`Airtel Money webhook error: ${err.message}`);
    throw new ErrorHandler(500, 'Airtel Money webhook processing failed');
  }
};