// src/payments/gateways/skrill.js
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');
const retry = require('../../utils/retry');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const emailService = require('../../services/emailService');
const smsService = require('../../services/smsService');

const paypalSupportedCountries = require('../../utils/constants').paypalSupportedCountries;

function validateCountry(countryCode) {
  if (!paypalSupportedCountries.includes(countryCode)) {
    throw new ErrorHandler(400, 'Skrill not supported in your country');
  }
}

async function sendNotifications(userId, status, amount, currency, transactionId) {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    await emailService.sendPaymentNotification(user.email, status, amount, currency, transactionId);
    await smsService.sendPaymentNotification(`+${user.countryCode}${user.phone}`, status, amount, currency, transactionId);
  } catch (err) {
    logger.error(`Skrill notification error for user ${userId}: ${err.message}`);
  }
}

exports.processPayment = async (options) => {
  const { amount, currency, details, userId, paymentId } = options;
  validateCountry(details.countryCode);

  try {
    const user = await User.findById(userId);
    const payload = {
      pay_to_email: 'merchant@wealthybridge.com',
      merchant_id: process.env.SKRILL_MERCHANT_ID,
      transaction_id: `WB-${userId}-${Date.now()}`,
      return_url: process.env.SKRILL_RETURN_URL,
      cancel_url: process.env.SKRILL_CANCEL_URL,
      status_url: process.env.SKRILL_STATUS_URL,
      amount: amount.toFixed(2),
      currency,
      language: 'EN',
      prepare_only: '1',
      detail1_description: options.type === 'verification' ? 'Verification Fee' : 'Investment Payment',
      detail1_text: `Payment for WealthyBridge ${options.type}`,
    };

    const response = await retry.retryOperation(() =>
      axios.post('https://pay.skrill.com', payload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    );

    if (!response.data.session_id) {
      logger.error(`Skrill payment initiation failed: ${JSON.stringify(response.data)}`);
      return { success: false };
    }

    const payment = await Payment.findById(paymentId);
    if (payment) {
      payment.transactionId = payload.transaction_id;
      await payment.save();
    }

    logger.info(`Skrill payment initiated: ${amount} ${currency} for user ${userId}`);
    await sendNotifications(userId, 'initiated', amount, currency, payload.transaction_id);
    return {
      success: true,
      transactionId: payload.transaction_id,
      approvalUrl: `https://pay.skrill.com?sid=${response.data.session_id}`,
      pending: true,
    };
  } catch (err) {
    logger.error(`Skrill payment error: ${err.message}`);
    throw new ErrorHandler(500, 'Skrill payment processing failed');
  }
};

exports.capturePayment = async (transactionId, userId, paymentId) => {
  try {
    const response = await retry.retryOperation(() =>
      axios.get('https://www.skrill.com/api/status_trn', {
        params: {
          action: 'status_trn',
          merchant_id: process.env.SKRILL_MERCHANT_ID,
          trn_id: transactionId,
          password: process.env.SKRILL_API_PASSWORD,
        },
      })
    );

    const payment = await Payment.findById(paymentId);
    if (!payment) throw new ErrorHandler(404, 'Payment not found');

    if (response.data.status === '2') {
      payment.status = 'success';
      await payment.save();
      await sendNotifications(userId, 'success', payment.localAmount, payment.currency, transactionId);
      logger.info(`Skrill payment captured: ${transactionId}`);
      return { success: true, transactionId };
    } else {
      payment.status = 'failed';
      await payment.save();
      await sendNotifications(userId, 'failed', payment.localAmount, payment.currency, transactionId);
      logger.error(`Skrill capture failed: ${response.data.status}`);
      return { success: false };
    }
  } catch (err) {
    logger.error(`Skrill capture error: ${err.message}`);
    throw new ErrorHandler(500, 'Skrill capture failed');
  }
};

exports.processRefund = async (options) => {
  const { amount, originalTransactionId, userId } = options;

  try {
    const response = await retry.retryOperation(() =>
      axios.post('https://www.skrill.com/api/refunded', {
        action: 'refund',
        merchant_id: process.env.SKRILL_MERCHANT_ID,
        trn_id: originalTransactionId,
        amount: amount.toFixed(2),
        password: process.env.SKRILL_API_PASSWORD,
      })
    );

    if (response.data.status !== '2') {
      logger.error(`Skrill refund failed: ${JSON.stringify(response.data)}`);
      return { success: false };
    }

    logger.info(`Skrill refund processed: ${amount} USD for ${originalTransactionId}`);
    await sendNotifications(userId, 'success', amount, 'USD', response.data.refunded_trn_id || originalTransactionId);
    return { success: true, transactionId: response.data.refunded_trn_id || originalTransactionId };
  } catch (err) {
    logger.error(`Skrill refund error: ${err.message}`);
    throw new ErrorHandler(500, 'Skrill refund processing failed');
  }
};

exports.processWithdrawal = async (options) => {
  const { amount, currency, details, userId } = options;
  if (!details.email) throw new ErrorHandler(400, 'Skrill email required');

  try {
    const response = await retry.retryOperation(() =>
      axios.post('https://www.skrill.com/api/transfer', {
        action: 'transfer',
        merchant_id: process.env.SKRILL_MERCHANT_ID,
        pay_to_email: details.email,
        amount: amount.toFixed(2),
        currency,
        subject: 'WealthyBridge Withdrawal',
        note: 'Investment withdrawal from WealthyBridge',
        password: process.env.SKRILL_API_PASSWORD,
      })
    );

    if (response.data.status !== '2') {
      logger.error(`Skrill payout failed: ${JSON.stringify(response.data)}`);
      return { success: false };
    }

    logger.info(`Skrill payout initiated: ${amount} ${currency} to ${details.email}`);
    await sendNotifications(userId, 'success', amount, currency, response.data.trn_id || `WB-${userId}-${Date.now()}`);
    return { success: true, transactionId: response.data.trn_id || `WB-${userId}-${Date.now()}` };
  } catch (err) {
    logger.error(`Skrill payout error: ${err.message}`);
    throw new ErrorHandler(500, 'Skrill payout processing failed');
  }
};

exports.handleCallback = async (payload) => {
  try {
    const { merchant_id, transaction_id, status, mb_amount, currency } = payload;
    if (merchant_id !== process.env.SKRILL_MERCHANT_ID) {
      throw new ErrorHandler(400, 'Invalid merchant ID');
    }

    const concat = `${merchant_id}${transaction_id}${process.env.SKRILL_MQI_KEY}`;
    const calculatedSig = crypto.createHash('md5').update(concat).digest('hex');
    if (calculatedSig !== payload.md5sig) {
      throw new ErrorHandler(400, 'Invalid webhook signature');
    }

    const payment = await Payment.findOne({ transactionId });
    if (!payment) throw new ErrorHandler(404, 'Payment not found');

    const success = status === '2';
    payment.status = success ? 'success' : 'failed';
    await payment.save();

    await sendNotifications(payment.user, success ? 'success' : 'failed', payment.localAmount, payment.currency, transaction_id);
    logger.info(`Skrill webhook processed: ${transaction_id} ${success ? 'success' : 'failed'}`);
    return { success, txId: transaction_id };
  } catch (err) {
    logger.error(`Skrill webhook error: ${err.message}`);
    throw new ErrorHandler(500, 'Skrill webhook processing failed');
  }
};