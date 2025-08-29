const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter;

// ✅ Initialize transporter based on environment
(async () => {
  if (process.env.NODE_ENV === 'development') {
    // Use Ethereal for testing
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info(`Ethereal test account created: ${testAccount.user}`);
  } else {
    // Use real SMTP for production (SendGrid, Gmail, etc.)
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
})();

// ✅ Generic email sender
async function sendEmail(to, subject, text) {
  if (!transporter) {
    throw new Error('Email transporter not initialized');
  }

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"WealthyBridge" <noreply@wealthybridge.com>',
    to,
    subject,
    text,
  });

  if (process.env.NODE_ENV === 'development') {
    logger.info(`Ethereal Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
}

// ✅ Send OTP Email
exports.sendOTP = async (email, otp) => {
  await sendEmail(
    email,
    'Your OTP Code - WealthyBridge',
    `Your OTP code is: ${otp}. It will expire in 10 minutes.`
  );
  logger.info(`OTP email sent to ${email}`);
};

// ✅ Send Payment Confirmation Email
exports.sendPaymentConfirmation = async (email, amount, transactionId) => {
  await sendEmail(
    email,
    'Payment Confirmation - WealthyBridge',
    `Your payment of $${amount} was successful. Transaction ID: ${transactionId}.`
  );
  logger.info(`Payment confirmation email sent to ${email}`);
};

// ✅ Send Referral Bonus Email
exports.sendReferralBonus = async (email, bonusAmount) => {
  await sendEmail(
    email,
    'Referral Bonus - WealthyBridge',
    `Congratulations! You received a referral bonus of $${bonusAmount}. Keep referring!`
  );
  logger.info(`Referral bonus email sent to ${email}`);
};

// ✅ Send Account Bonus Email
exports.sendAccountBonus = async (email, bonusAmount) => {
  await sendEmail(
    email,
    'Account Bonus - WealthyBridge',
    `You have been credited with a bonus of $${bonusAmount}. Thank you for being with us!`
  );
  logger.info(`Account bonus email sent to ${email}`);
};
