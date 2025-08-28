// src/payments/gateways/mpesa.js
const axios = require('axios');
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');
const retry = require('../../utils/retry');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const emailService = require('../../services/emailService');
const smsService = require('../../services/smsService');

const pollingTasks = new Map();

async function getMpesaToken() {
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
  try {
    const response = await retry.retryOperation(() =>
      axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
        headers: { Authorization: `Basic ${auth}` },
      })
    );
    logger.info('M-Pesa OAuth token generated');
    return response.data.access_token;
  } catch (err) {
    logger.error(`M-Pesa token error: ${err.message}`);
    throw new ErrorHandler(500, 'Failed to authenticate with M-Pesa');
  }
}

function generatePassword() {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const rawPassword = `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(rawPassword).toString('base64');
}

async function sendNotifications(userId, status, amount, currency, transactionId) {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    await emailService.sendPaymentNotification(user.email, status, amount, currency, transactionId);
    await smsService.sendPaymentNotification(`+${user.countryCode}${user.phone}`, status, amount, currency, transactionId);
  } catch (err) {
    logger.error(`M-Pesa notification error for user ${userId}: ${err.message}`);
  }
}

async function pollStkPushStatus(checkoutRequestID, userId, paymentId) {
  const maxAttempts = parseInt(process.env.MPESA_POLLING_MAX_ATTEMPTS) || 12;
  const intervalMs = parseInt(process.env.MPESA_POLLING_INTERVAL_MS) || 5000;
  let attempts = 0;

  const poll = async () => {
    try {
      const token = await getMpesaToken();
      const response = await retry.retryOperation(() =>
        axios.post(
          'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
          {
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: generatePassword(),
            Timestamp: new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3),
            CheckoutRequestID: checkoutRequestID,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      const { ResultCode, ResultDesc } = response.data;
      const payment = await Payment.findById(paymentId);
      if (!payment) throw new ErrorHandler(404, 'Payment not found');

      if (ResultCode === '0') {
        payment.status = 'success';
        payment.transactionId = checkoutRequestID;
        await payment.save();
        pollingTasks.delete(checkoutRequestID);
        await sendNotifications(userId, 'success', payment.localAmount, payment.currency, checkoutRequestID);
        logger.info(`M-Pesa STK Push success for ${checkoutRequestID}`);
        return { success: true, transactionId: checkoutRequestID };
      } else if (['1032', '1037'].includes(ResultCode)) {
        payment.status = 'failed';
        await payment.save();
        pollingTasks.delete(checkoutRequestID);
        await sendNotifications(userId, ResultCode === '1032' ? 'failed' : 'timeout', payment.localAmount, payment.currency, checkoutRequestID);
        logger.info(`M-Pesa STK Push failed for ${checkoutRequestID}: ${ResultDesc}`);
        return { success: false };
      } else if (attempts >= maxAttempts) {
        payment.status = 'failed';
        await payment.save();
        pollingTasks.delete(checkoutRequestID);
        await sendNotifications(userId, 'timeout', payment.localAmount, payment.currency, checkoutRequestID);
        logger.warn(`M-Pesa STK Push timeout for ${checkoutRequestID} after ${maxAttempts} attempts`);
        return { success: false };
      }

      attempts++;
      pollingTasks.set(checkoutRequestID, setTimeout(poll, intervalMs));
    } catch (err) {
      logger.error(`M-Pesa STK poll error for ${checkoutRequestID}: ${err.message}`);
      if (attempts >= maxAttempts) {
        pollingTasks.delete(checkoutRequestID);
        const payment = await Payment.findById(paymentId);
        if (payment) {
          payment.status = 'failed';
          await payment.save();
          await sendNotifications(userId, 'timeout', payment.localAmount, payment.currency, checkoutRequestID);
        }
        return { success: false };
      }
      attempts++;
      pollingTasks.set(checkoutRequestID, setTimeout(poll, intervalMs));
    }
  };

  pollingTasks.set(checkoutRequestID, setTimeout(poll, intervalMs));
  await sendNotifications(userId, 'initiated', (await Payment.findById(paymentId)).localAmount, (await Payment.findById(paymentId)).currency, checkoutRequestID);
  return { success: true, transactionId: checkoutRequestID, pending: true };
}

exports.processPayment = async (options) => {
  const { amount, currency, details, userId, paymentId } = options;
  if (!details.phone) throw new ErrorHandler(400, 'Phone number required for M-Pesa');

  try {
    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const phoneNumber = details.phone.startsWith('+') ? details.phone.slice(1) : details.phone;

    const response = await retry.retryOperation(() =>
      axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        {
          BusinessShortCode: process.env.MPESA_SHORTCODE,
          Password: generatePassword(),
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.round(amount),
          PartyA: phoneNumber,
          PartyB: process.env.MPESA_SHORTCODE,
          PhoneNumber: phoneNumber,
          CallBackURL: process.env.MPESA_CALLBACK_URL,
          AccountReference: `WB-${userId}-${Date.now()}`,
          TransactionDesc: options.type === 'verification' ? 'Verification Fee' : 'Investment Payment',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );

    if (response.data.ResponseCode !== '0') {
      logger.error(`M-Pesa STK Push failed: ${JSON.stringify(response.data)}`);
      return { success: false };
    }

    logger.info(`M-Pesa STK Push initiated: ${amount} ${currency} for ${phoneNumber}`);
    return await pollStkPushStatus(response.data.CheckoutRequestID, userId, paymentId);
  } catch (err) {
    logger.error(`M-Pesa payment error: ${err.message}`);
    throw new ErrorHandler(500, 'M-Pesa payment processing failed');
  }
};

exports.processRefund = async (options) => {
  const { amount, originalTransactionId, userId } = options;

  try {
    const token = await getMpesaToken();
    const response = await retry.retryOperation(() =>
      axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/reversal/v1/request',
        {
          Initiator: process.env.MPESA_INITIATOR_NAME,
          SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
          CommandID: 'TransactionReversal',
          TransactionID: originalTransactionId,
          Amount: Math.round(amount),
          ReceiverParty: process.env.MPESA_SHORTCODE,
          RecieverIdentifierType: '11',
          ResultURL: process.env.MPESA_CALLBACK_URL,
          QueueTimeOutURL: process.env.MPESA_CALLBACK_URL,
          Remarks: 'Refund for cancelled investment',
          Occasion: `WB-${userId}`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );

    if (response.data.ResponseCode !== '0') {
      logger.error(`M-Pesa refund failed: ${JSON.stringify(response.data)}`);
      return { success: false };
    }

    logger.info(`M-Pesa refund initiated: ${amount} USD for ${originalTransactionId}`);
    await sendNotifications(userId, 'success', amount, 'USD', response.data.RequestID);
    return { success: true, transactionId: response.data.RequestID };
  } catch (err) {
    logger.error(`M-Pesa refund error: ${err.message}`);
    throw new ErrorHandler(500, 'M-Pesa refund processing failed');
  }
};

exports.processWithdrawal = async (options) => {
  const { amount, currency, details, userId } = options;
  if (!details.phone) throw new ErrorHandler(400, 'Phone number required for M-Pesa');

  try {
    const token = await getMpesaToken();
    const phoneNumber = details.phone.startsWith('+') ? details.phone.slice(1) : details.phone;
    const response = await retry.retryOperation(() =>
      axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest',
        {
          InitiatorName: process.env.MPESA_INITIATOR_NAME,
          SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
          CommandID: 'BusinessPayment',
          Amount: Math.round(amount),
          PartyA: process.env.MPESA_SHORTCODE,
          PartyB: phoneNumber,
          Remarks: 'Investment withdrawal',
          QueueTimeOutURL: process.env.MPESA_CALLBACK_URL,
          ResultURL: process.env.MPESA_CALLBACK_URL,
          Occasion: `WB-${userId}`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );

    if (response.data.ResponseCode !== '0') {
      logger.error(`M-Pesa withdrawal failed: ${JSON.stringify(response.data)}`);
      return { success: false };
    }

    logger.info(`M-Pesa withdrawal initiated: ${amount} ${currency} to ${phoneNumber}`);
    await sendNotifications(userId, 'success', amount, currency, response.data.ConversationID);
    return { success: true, transactionId: response.data.ConversationID };
  } catch (err) {
    logger.error(`M-Pesa withdrawal error: ${err.message}`);
    throw new ErrorHandler(500, 'M-Pesa withdrawal processing failed');
  }
};

exports.handleCallback = async (payload) => {
  try {
    const result = payload.Body?.stkCallback || payload.Body?.Result;
    if (!result) throw new ErrorHandler(400, 'Invalid M-Pesa callback payload');

    let transactionId, success;
    if (result.CheckoutRequestID) {
      transactionId = result.CheckoutRequestID;
      success = result.ResultCode === 0;
      const payment = await Payment.findOne({ transactionId });
      if (payment) {
        payment.status = success ? 'success' : 'failed';
        await payment.save();
        pollingTasks.delete(transactionId);
        await sendNotifications(payment.user, success ? 'success' : result.ResultCode === '1032' ? 'failed' : 'timeout', payment.localAmount, payment.currency, transactionId);
      }
    } else if (result.ResultCode !== undefined) {
      transactionId = result.TransactionID || result.ConversationID;
      success = result.ResultCode === 0;
      const payment = await Payment.findOne({ transactionId });
      if (payment) {
        payment.status = success ? 'success' : 'failed';
        await payment.save();
        await sendNotifications(payment.user, success ? 'success' : 'failed', payment.localAmount, payment.currency, transactionId);
      }
    } else {
      throw new ErrorHandler(400, 'Unknown callback type');
    }

    logger.info(`M-Pesa callback: ${transactionId} ${success ? 'success' : 'failed'}`);
    return { success, txId: transactionId };
  } catch (err) {
    logger.error(`M-Pesa callback error: ${err.message}`);
    throw new ErrorHandler(500, 'M-Pesa callback processing failed');
  }
};

exports.cleanup = () => {
  pollingTasks.forEach((task, checkoutRequestID) => {
    clearTimeout(task);
    logger.info(`Stopped polling for ${checkoutRequestID}`);
  });
  pollingTasks.clear();
};