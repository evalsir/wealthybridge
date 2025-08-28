// src/payments/gateways/paypal.js
const paypal = require('@paypal/checkout-server-sdk');
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');
const retry = require('../../utils/retry');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const emailService = require('../../services/emailService');
const smsService = require('../../services/smsService');

const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET);
const client = new paypal.core.PayPalHttpClient(environment);

const paypalSupportedCountries = require('../../utils/constants').paypalSupportedCountries;

function validateCountry(countryCode) {
  if (!paypalSupportedCountries.includes(countryCode)) {
    throw new ErrorHandler(400, 'PayPal not supported in your country');
  }
}

async function sendNotifications(userId, status, amount, currency, transactionId) {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    await emailService.sendPaymentNotification(user.email, status, amount, currency, transactionId);
    await smsService.sendPaymentNotification(`+${user.countryCode}${user.phone}`, status, amount, currency, transactionId);
  } catch (err) {
    logger.error(`PayPal notification error for user ${userId}: ${err.message}`);
  }
}

exports.processPayment = async (options) => {
  const { amount, currency, details, userId, paymentId } = options;
  validateCountry(details.countryCode);

  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
      }],
      application_context: {
        return_url: process.env.PAYPAL_RETURN_URL,
        cancel_url: process.env.PAYPAL_CANCEL_URL,
      },
    });

    const response = await retry.retryOperation(() => client.execute(request));
    const order = response.result;

    const payment = await Payment.findById(paymentId);
    if (payment) {
      payment.transactionId = order.id;
      await payment.save();
    }

    logger.info(`PayPal payment initiated: ${amount} ${currency} for user ${userId}`);
    await sendNotifications(userId, 'initiated', amount, currency, order.id);
    return {
      success: true,
      transactionId: order.id,
      approvalUrl: order.links.find(link => link.rel === 'approve').href,
      pending: true,
    };
  } catch (err) {
    logger.error(`PayPal payment error: ${err.message}`);
    throw new ErrorHandler(500, 'PayPal payment processing failed');
  }
};

exports.capturePayment = async (orderId, userId, paymentId) => {
  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    const response = await retry.retryOperation(() => client.execute(request));
    const capture = response.result;

    const payment = await Payment.findById(paymentId);
    if (!payment) throw new ErrorHandler(404, 'Payment not found');

    if (capture.status !== 'COMPLETED') {
      payment.status = 'failed';
      await payment.save();
      await sendNotifications(userId, 'failed', payment.localAmount, payment.currency, orderId);
      logger.error(`PayPal capture failed for ${orderId}: ${capture.status}`);
      return { success: false };
    }

    payment.status = 'success';
    await payment.save();
    await sendNotifications(userId, 'success', payment.localAmount, payment.currency, orderId);
    logger.info(`PayPal payment captured: ${orderId}`);
    return { success: true, transactionId: orderId };
  } catch (err) {
    logger.error(`PayPal capture error: ${err.message}`);
    throw new ErrorHandler(500, 'PayPal capture failed');
  }
};

exports.processRefund = async (options) => {
  const { amount, originalTransactionId, userId } = options;

  try {
    const request = new paypal.payments.CapturesRefundRequest(originalTransactionId);
    request.requestBody({
      amount: {
        currency_code: 'USD',
        value: amount.toFixed(2),
      },
    });

    const response = await retry.retryOperation(() => client.execute(request));
    const refund = response.result;

    if (refund.status !== 'COMPLETED') {
      logger.error(`PayPal refund failed for ${originalTransactionId}: ${refund.status}`);
      return { success: false };
    }

    logger.info(`PayPal refund processed: ${amount} USD for ${originalTransactionId}`);
    await sendNotifications(userId, 'success', amount, 'USD', refund.id);
    return { success: true, transactionId: refund.id };
  } catch (err) {
    logger.error(`PayPal refund error: ${err.message}`);
    throw new ErrorHandler(500, 'PayPal refund processing failed');
  }
};

exports.processWithdrawal = async (options) => {
  const { amount, currency, details, userId } = options;
  if (!details.email) throw new ErrorHandler(400, 'PayPal email required');

  try {
    const request = new paypal.payouts.PayoutsPostRequest();
    request.requestBody({
      sender_batch_header: {
        sender_batch_id: `Payout-${userId}-${Date.now()}`,
        email_subject: 'WealthyBridge Investment Withdrawal',
      },
      items: [{
        recipient_type: 'EMAIL',
        amount: {
          value: amount.toFixed(2),
          currency,
        },
        receiver: details.email,
        note: 'Investment withdrawal from WealthyBridge',
      }],
    });

    const response = await retry.retryOperation(() => client.execute(request));
    const payout = response.result;

    if (payout.batch_header.batch_status !== 'PENDING' && payout.batch_header.batch_status !== 'SUCCESS') {
      logger.error(`PayPal payout failed: ${JSON.stringify(payout)}`);
      return { success: false };
    }

    logger.info(`PayPal payout initiated: ${amount} ${currency} to ${details.email}`);
    await sendNotifications(userId, 'success', amount, currency, payout.batch_header.payout_batch_id);
    return { success: true, transactionId: payout.batch_header.payout_batch_id };
  } catch (err) {
    logger.error(`PayPal payout error: ${err.message}`);
    throw new ErrorHandler(500, 'PayPal payout processing failed');
  }
};

exports.handleCallback = async (payload) => {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const webhookEvent = await retry.retryOperation(() =>
      paypal.webhooks.WebhookEvent.verify(payload.headers, JSON.stringify(payload.body), webhookId, client)
    );

    const eventType = webhookEvent.event_type;
    const resource = webhookEvent.resource;

    let transactionId, success;
    if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      transactionId = resource.id;
      const payment = await Payment.findOne({ transactionId });
      if (payment) {
        const result = await exports.capturePayment(transactionId, payment.user, payment._id);
        return result;
      }
    } else if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      transactionId = resource.id;
      success = true;
      const payment = await Payment.findOne({ transactionId });
      if (payment) {
        payment.status = 'success';
        await payment.save();
        await sendNotifications(payment.user, 'success', payment.localAmount, payment.currency, transactionId);
      }
    } else if (eventType === 'PAYMENT.CAPTURE.DENIED' || eventType === 'PAYMENT.CAPTURE.REFUNDED') {
      transactionId = resource.id;
      success = false;
      const payment = await Payment.findOne({ transactionId });
      if (payment) {
        payment.status = 'failed';
        await payment.save();
        await sendNotifications(payment.user, 'failed', payment.localAmount, payment.currency, transactionId);
      }
    } else {
      logger.warn(`Unhandled PayPal webhook event: ${eventType}`);
      return { success: false };
    }

    logger.info(`PayPal webhook processed: ${eventType} for ${transactionId}`);
    return { success, txId: transactionId };
  } catch (err) {
    logger.error(`PayPal webhook error: ${err.message}`);
    throw new ErrorHandler(500, 'PayPal webhook processing failed');
  }
};