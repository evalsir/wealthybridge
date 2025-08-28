// src/services/smsService.js
const twilio = require('twilio');
const logger = require('../utils/logger');

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

exports.sendPaymentNotification = async (phone, status, amount, currency, transactionId) => {
  const message = `Your payment of ${amount} ${currency} (ID: ${transactionId}) is ${status}.`;
  await client.messages.create({
    body: message,
    from: process.env.SMS_FROM,
    to: phone,
  });
  logger.info(`Payment SMS sent to ${phone}: ${status}`);
};

exports.sendReferralNotification = async (phone, referrerEmail) => {
  const message = `You were referred to WealthyBridge by ${referrerEmail}. Sign up and invest!`;
  await client.messages.create({
    body: message,
    from: process.env.SMS_FROM,
    to: phone,
  });
  logger.info(`Referral SMS sent to ${phone}`);
};

exports.sendBonusNotification = async (phone, bonusAmount, currency) => {
  const message = `You earned a referral bonus of ${bonusAmount} ${currency}!`;
  await client.messages.create({
    body: message,
    from: process.env.SMS_FROM,
    to: phone,
  });
  logger.info(`Bonus SMS sent to ${phone}`);
};