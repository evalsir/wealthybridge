// src/payments/gateways/americanexpress.js
const Stripe = require('stripe');
const logger = require('../../utils/logger');
const ErrorHandler = require('../../utils/errorHandler');
const retry = require('../../utils/retry');
const Payment = require('../../models/Payment');
const User = require('../../models/User');
const emailService = require('../../services/emailService');
const smsService = require('../../services/smsService');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supportedCountries = require('../../utils/constants').paypalSupportedCountries;

function validateCountry(countryCode) {
  if (!supportedCountries.includes(countryCode)) {
    throw new ErrorHandler(400, 'American Express not supported in your country');
  }
}

function validateAmExCard(cardNumber) {
  // AmEx cards start with 34 or 37 and are 15 digits
  const amexRegex = /^3[47][0-9]{13}$/;
  if (!amexRegex.test(cardNumber)) {
    throw new ErrorHandler(400, 'Invalid American Express card number');
  }
}

async function sendNotifications(userId, status, amount, currency, transactionId) {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    await emailService.sendPaymentNotification(user.email, status, amount, currency, transactionId);
    await smsService.sendPaymentNotification(`+${user.countryCode}${user.phone}`, status, amount, currency, transactionId);
  } catch (err) {
    logger.error(`American Express notification error for user ${userId}: ${err.message}`);
  }
}

exports.processPayment = async (options) => {
  const { amount, currency, details, userId, paymentId } = options;
  validateCountry(details.countryCode);
  if (!details.cardNumber || !details.cvv || !details.expiryMonth || !details.expiryYear) {
    throw new ErrorHandler(400, 'Card details required for American Express');
  }
  validateAmExCard(details.cardNumber);

  try {
    const paymentIntent = await retry.retryOperation(() =>
      stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        payment_method_data: {
          type: 'card',
          card: {
            number: details.cardNumber,
            exp_month: parseInt(details.expiryMonth),
            exp_year: parseInt(details.expiryYear),
            cvc: details.cvv,
          },
        },
        confirmation_method: 'manual',
        confirm: true,
        return_url: process.env.STRIPE_RETURN_URL,
        metadata: { userId, paymentId },
      })
    );

    const payment = await Payment.findById(paymentId);
    if (payment) {
      payment.transactionId = paymentIntent.id;
      await payment.save();
    }

    logger.info(`American Express payment initiated: ${amount} ${currency} for user ${userId}`);
    await sendNotifications(userId, 'initiated', amount, currency, paymentIntent.id);
    return {
      success: true,
      transactionId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      pending: paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_confirmation',
    };
  } catch (err) {
    logger.error(`American Express payment error: ${err.message}`);
    throw new ErrorHandler(500, 'American Express payment processing failed');
  }
};

exports.capturePayment = async (transactionId, userId, paymentId) => {
  try {
    const paymentIntent = await retry.retryOperation(() => stripe.paymentIntents.retrieve(transactionId));
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new ErrorHandler(404, 'Payment not found');

    if (paymentIntent.status === 'succeeded') {
      payment.status = 'success';
      await payment.save();
      await sendNotifications(userId, 'success', payment.localAmount, payment.currency, transactionId);
      logger.info(`American Express payment captured: ${transactionId}`);
      return { success: true, transactionId };
    } else if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_confirmation') {
      logger.info(`American Express payment requires action: ${transactionId}`);
      return { success: true, transactionId, pending: true };
    } else {
      payment.status = 'failed';
      await payment.save();
      await sendNotifications(userId, 'failed', payment.localAmount, payment.currency, transactionId);
      logger.error(`American Express capture failed: ${paymentIntent.status}`);
      return { success: false };
    }
  } catch (err) {
    logger.error(`American Express capture error: ${err.message}`);
    throw new ErrorHandler(500, 'American Express capture failed');
  }
};

exports.processRefund = async (options) => {
  const { amount, originalTransactionId, userId } = options;

  try {
    const refund = await retry.retryOperation(() =>
      stripe.refunds.create({
        payment_intent: originalTransactionId,
        amount: Math.round(amount * 100),
      })
    );

    logger.info(`American Express refund processed: ${amount} USD for ${originalTransactionId}`);
    await sendNotifications(userId, 'success', amount, 'USD', refund.id);
    return { success: true, transactionId: refund.id };
  } catch (err) {
    logger.error(`American Express refund error: ${err.message}`);
    throw new ErrorHandler(500, 'American Express refund processing failed');
  }
};

exports.processWithdrawal = async (options) => {
  const { amount, currency, details, userId } = options;
  if (!details.accountNumber) throw new ErrorHandler(400, 'Bank account required for American Express');

  try {
    const payout = await retry.retryOperation(() =>
      stripe.payouts.create({
        amount: Math.round(amount * 100),
        currency,
        destination: details.accountNumber,
        description: 'WealthyBridge Withdrawal',
        metadata: { userId },
      })
    );

    logger.info(`American Express payout initiated: ${amount} ${currency} to ${details.accountNumber}`);
    await sendNotifications(userId, 'success', amount, currency, payout.id);
    return { success: true, transactionId: payout.id };
  } catch (err) {
    logger.error(`American Express payout error: ${err.message}`);
    throw new ErrorHandler(500, 'American Express payout processing failed');
  }
};

exports.handleCallback = async (payload) => {
  try {
    const signature = payload.headers['stripe-signature'];
    const event = await retry.retryOperation(() =>
      stripe.webhooks.constructEvent(payload.body, signature, process.env.STRIPE_WEBHOOK_SECRET)
    );

    let transactionId, success;
    if (event.type === 'payment_intent.succeeded') {
      transactionId = event.data.object.id;
      success = true;
      const payment = await Payment.findOne({ transactionId });
      if (payment) {
        payment.status = 'success';
        await payment.save();
        await sendNotifications(payment.user, 'success', payment.localAmount, payment.currency, transactionId);
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      transactionId = event.data.object.id;
      success = false;
      const payment = await Payment.findOne({ transactionId });
      if (payment) {
        payment.status = 'failed';
        await payment.save();
        await sendNotifications(payment.user, 'failed', payment.localAmount, payment.currency, transactionId);
      }
    } else {
      logger.warn(`Unhandled American Express webhook event: ${event.type}`);
      return { success: false };
    }

    logger.info(`American Express webhook processed: ${event.type} for ${transactionId}`);
    return { success, txId: transactionId };
  } catch (err) {
    logger.error(`American Express webhook error: ${err.message}`);
    throw new ErrorHandler(500, 'American Express webhook processing failed');
  }
};