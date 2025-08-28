// src/services/emailService.js
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendPaymentNotification = async (email, status, amount, currency, transactionId) => {
  const subject = `Payment ${status} - WealthyBridge`;
  const text = `Your payment of ${amount} ${currency} (ID: ${transactionId}) is ${status}.`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    text,
  });
  logger.info(`Payment notification sent to ${email}: ${status}`);
};

exports.sendReferralNotification = async (referredEmail, referrerEmail) => {
  const subject = 'You Have Been Referred to WealthyBridge';
  const text = `You were referred by ${referrerEmail}. Sign up and invest to earn rewards!`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: referredEmail,
    subject,
    text,
  });
  logger.info(`Referral notification sent to ${referredEmail}`);
};

exports.sendBonusNotification = async (email, bonusAmount, currency) => {
  const subject = 'Referral Bonus Received - WealthyBridge';
  const text = `You earned a referral bonus of ${bonusAmount} ${currency}!`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    text,
  });
  logger.info(`Bonus notification sent to ${email}`);
};