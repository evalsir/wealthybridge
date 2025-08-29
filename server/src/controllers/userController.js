// /home/gnais/AW/server/src/controllers/userController.js
const dotenv = require('dotenv');
require('dotenv').config(); // Make sure .env variables are loaded
const User = require('../models/User');
const Referral = require('../models/Referral');
const Payment = require('../models/Payment');
const Investment = require('../models/Investment');
const SupportTicket = require('../models/SupportTicket');
const ErrorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { paypalUnsupportedCountryCodes } = require('../utils/constants');
const Stripe = require('stripe');
const PayPal = require('@paypal/checkout-server-sdk');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const paypalClient = new PayPal.core.PayPalHttpClient(
  new PayPal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_SECRET
  )
);

exports.createReferral = async (req, res, next) => {
  const { referredEmail } = req.body;
  const referrerId = req.user._id;

  try {
    const referrer = await User.findById(referrerId);
    if (!referrer) throw new ErrorHandler(404, 'Referrer not found');

    const referred = await User.findOne({ email: referredEmail });
    if (!referred) throw new ErrorHandler(404, 'Referred user not found');
    if (referred._id.equals(referrerId)) throw new ErrorHandler(400, 'Cannot refer yourself');

    const existingReferral = await Referral.findOne({ referrer: referrerId, referred: referred._id });
    if (existingReferral) throw new ErrorHandler(400, 'Referral already exists');

    const referral = new Referral({
      referrer: referrerId,
      referred: referred._id,
      currency: 'USD',
    });

    await referral.save();
    logger.info(`Referral created: ${referrerId} referred ${referredEmail}`);

    await emailService.sendReferralNotification(referred.email, referrer.email);
    await smsService.sendReferralNotification(`+${referred.countryCode}${referred.phone}`, referrer.email);

    res.json({ success: true, referralId: referral._id });
  } catch (err) {
    logger.error(`Referral creation error: ${err.message}`);
    next(err);
  }
};

exports.getReferrals = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const referrals = await Referral.find({ referrer: userId }).populate('referred', 'email');
    res.json({ success: true, referrals });
  } catch (err) {
    logger.error(`Get referrals error: ${err.message}`);
    next(err);
  }
};

// Removed: calculateReferralBonus moved to paymentService.handleReferralBonus

exports.getUserStats = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return next(new ErrorHandler(404, 'User not found'));

    const totalInvestment = await Investment.aggregate([
      { $match: { user: req.user.userId, status: 'Approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const referrals = await User.countDocuments({ referredBy: req.user.userId });

    res.json({
      success: true,
      name: `${user.firstName} ${user.lastName}`.trim(),
      totalInvestment: totalInvestment[0]?.total || 0,
      balance: user.balance || 0,
      referrals,
    });
  } catch (err) {
    logger.error(`Get user stats error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error fetching user stats'));
  }
};

exports.getUserActivity = async (req, res, next) => {
  try {
    const { type } = req.query;
    const query = { user: req.user.userId };
    if (type && type !== 'All') {
      query.type = type;
    }

    const investments = await Investment.find(query).sort({ createdAt: -1 }).limit(8);
    const payments = await Payment.find({ user: req.user.userId, type: 'withdrawal' })
      .sort({ createdAt: -1 })
      .limit(8);

    const activity = [
      ...investments.map(inv => ({
        id: inv._id,
        type: 'Investment',
        plan: inv.plan,
        amount: inv.amount,
        status: inv.status,
        date: new Date(inv.createdAt).toLocaleDateString(),
      })),
      ...payments.map(pay => ({
        id: pay._id,
        type: 'Withdrawal',
        plan: 'N/A',
        amount: pay.amount,
        status: pay.status,
        date: new Date(pay.createdAt).toLocaleDateString(),
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

    res.json({ success: true, activity });
  } catch (err) {
    logger.error(`Get user activity error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error fetching user activity'));
  }
};

exports.getInvestments = async (req, res, next) => {
  try {
    const { plan, start, end } = req.query;
    const query = { user: req.user.userId };

    if (plan && plan !== 'All') {
      query.plan = { $regex: plan, $options: 'i' };
    }
    if (start) {
      query.createdAt = { $gte: new Date(start) };
    }
    if (end) {
      query.createdAt = { ...query.createdAt, $lte: new Date(end) };
    }

    const investments = await Investment.find(query).sort({ createdAt: -1 });

    const formattedInvestments = investments.map(inv => ({
      _id: inv._id,
      plan: inv.plan,
      shares: inv.shares,
      amount: inv.amount,
      expectedProfit: inv.expectedProfit,
      status: inv.status,
      date: inv.createdAt,
      startDate: inv.startDate,
      createdAt: inv.createdAt,
    }));

    res.json({ success: true, investments: formattedInvestments });
  } catch (err) {
    logger.error(`Get investments error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error fetching investments'));
  }
};

exports.createInvestment = async (req, res, next) => {
  const {
    plan,
    shares,
    amount,
    paymentMethod,
    paymentName,
    phoneNumber,
    paymentToken,
    referralCode,
  } = req.body;

  try {
    const user = await User.findById(req.user.userId);
    if (!user) return next(new ErrorHandler(404, 'User not found'));

    if (!user.hasPaidVerificationFee) {
      return next(new ErrorHandler(400, 'Verification fee required'));
    }

    const planData = {
      basic_1m: { profit: 13, minInvestment: 50, maxInvestment: 5000, sharesRange: [1, 100], duration: 28 },
      basic_2m: { profit: 22, minInvestment: 50, maxInvestment: 10000, sharesRange: [2, 200], duration: 56 },
      premium_3m: { profit: 27, minInvestment: 300, maxInvestment: 15000, sharesRange: [6, 300], duration: 84 },
      premium_6m: { profit: 33, minInvestment: 500, maxInvestment: 25000, sharesRange: [10, 500], duration: 172 },
      super_9m: { profit: 39, minInvestment: 1500, maxInvestment: 50000, sharesRange: [30, 1000], duration: 260 },
      super_12m: { profit: 45, minInvestment: 2500, maxInvestment: 100000, sharesRange: [50, 2000], duration: 348 },
    }[plan];

    if (!planData) return next(new ErrorHandler(400, 'Invalid plan'));

    const [minShares, maxShares] = planData.sharesRange;
    if (shares < minShares || shares > maxShares) {
      return next(new ErrorHandler(400, `Shares must be between ${minShares} and ${maxShares}`));
    }

    if (amount < planData.minInvestment || amount > planData.maxInvestment) {
      return next(new ErrorHandler(400, `Amount must be between $${planData.minInvestment} and $${planData.maxInvestment}`));
    }

    if (paymentName.toLowerCase() !== `${user.firstName} ${user.lastName}`.toLowerCase().trim()) {
      return next(new ErrorHandler(400, 'Payment name mismatch', 'payment_name_mismatch'));
    }

    let payment;
    if (paymentMethod === 'stripe' && paymentToken) {
      const charge = await stripe.charges.create({
        amount: amount * 100,
        currency: 'usd',
        source: paymentToken,
        description: `Investment: ${plan} for user ${user._id}`,
      });
      payment = new Payment({
        user: req.user.userId,
        amount,
        currency: 'USD',
        type: 'investment',
        status: charge.status === 'succeeded' ? 'Completed' : 'Failed',
        transactionId: charge.id,
        paymentMethod,
      });
    } else if (['paypal', 'skrill', 'flutterwave'].includes(paymentMethod)) {
      const request = new PayPal.orders.OrdersCreateRequest();
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: 'USD', value: amount.toString() } }],
      });
      const response = await paypalClient.execute(request);
      payment = new Payment({
        user: req.user.userId,
        amount,
        currency: 'USD',
        type: 'investment',
        status: 'Pending',
        transactionId: response.result.id,
        paymentMethod,
      });
      await payment.save();
      return res.status(200).json({ success: true, redirectUrl: response.result.links.find(link => link.rel === 'approve').href });
    } else if (['mpesa', 'airtelmoney', 'mtn', 'tigopesa'].includes(paymentMethod)) {
      if (!phoneNumber || !/^\+\d{10,14}$/.test(phoneNumber)) {
        return next(new ErrorHandler(400, 'Invalid phone number'));
      }
      payment = new Payment({
        user: req.user.userId,
        amount,
        currency: 'USD',
        type: 'investment',
        status: 'Pending',
        transactionId: `MOBILE-${uuidv4()}`,
        paymentMethod,
        phoneNumber,
      });
    } else {
      return next(new ErrorHandler(400, 'Invalid payment method'));
    }

    await payment.save();

    const investment = new Investment({
      user: req.user.userId,
      plan,
      shares,
      amount,
      expectedProfit: amount * (planData.profit / 100),
      status: payment.status === 'Completed' ? 'Approved' : 'Pending',
      startDate: new Date(),
      duration: planData.duration,
      payment: payment._id,
    });

    await investment.save();

    if (referralCode && user.referredBy) {
      const referrer = await User.findById(user.referredBy);
      if (referrer) {
        const bonus = amount * 0.04; // 4% referral bonus
        referrer.balance = (referrer.balance || 0) + bonus;
        await referrer.save();
        logger.info(`Referral bonus of $${bonus} added to user ${referrer._id}`);
      }
    }

    logger.info(`Investment created: ${investment._id} for user ${req.user.userId}`);
    res.status(201).json({ success: true, investmentId: investment._id });
  } catch (err) {
    logger.error(`Create investment error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error creating investment'));
  }
};

exports.cancelInvestment = async (req, res, next) => {
  const { id } = req.params;

  try {
    const investment = await Investment.findOne({ _id: id, user: req.user.userId });
    if (!investment) return next(new ErrorHandler(404, 'Investment not found'));

    if (investment.status !== 'Pending') {
      return next(new ErrorHandler(400, 'Only pending investments can be cancelled'));
    }

    investment.status = 'Cancelled';
    await investment.save();

    const payment = await Payment.findById(investment.payment);
    if (payment) {
      payment.status = 'Failed';
      await payment.save();
    }

    logger.info(`Investment ${id} cancelled by user ${req.user.userId}`);
    res.json({ success: true, message: 'Investment cancelled successfully' });
  } catch (err) {
    logger.error(`Cancel investment error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error cancelling investment'));
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select(
      'firstName lastName email phone countryCode preferredPaymentMethod address referralCode hasPaidVerificationFee twoFactorEnabled termsAccepted'
    );
    if (!user) return next(new ErrorHandler(404, 'User not found'));

    res.json({
      success: true,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      phone: user.phone,
      countryCode: user.countryCode,
      preferredPaymentMethod: user.preferredPaymentMethod,
      address: user.address,
      referralCode: user.referralCode,
      hasPaidVerificationFee: user.hasPaidVerificationFee,
      twoFactorEnabled: user.twoFactorEnabled,
      termsAccepted: user.termsAccepted,
    });
  } catch (err) {
    logger.error(`Get profile error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error fetching profile'));
  }
};

exports.updateProfile = async (req, res, next) => {
  const { name, email, phone, countryCode, preferredPaymentMethod, address } = req.body;

  try {
    const user = await User.findById(req.user.userId);
    if (!user) return next(new ErrorHandler(404, 'User not found'));

    if (paypalUnsupportedCountryCodes.includes(countryCode?.toUpperCase())) {
      return next(new ErrorHandler(400, 'Country not supported by PayPal'));
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) return next(new ErrorHandler(400, 'Email already exists'));
    }

    if (phone && phone !== user.phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) return new ErrorHandler(400, 'Phone number already exists');
    }

    const [firstName, ...lastNameParts] = name.trim().split(' ');
    user.firstName = firstName || user.firstName;
    user.lastName = lastNameParts.join(' ') || user.lastName;
    user.email = email || user.email;
    user.phone = phone ? `${countryCode}${phone}` : user.phone;
    user.countryCode = countryCode || user.countryCode;
    user.preferredPaymentMethod = preferredPaymentMethod || user.preferredPaymentMethod;
    user.address = address || user.address;

    await user.save();

    logger.info(`Profile updated for user ${req.user.userId}`);
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    logger.error(`Update profile error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error updating profile'));
  }
};

exports.createSupportTicket = async (req, res, next) => {
  const { name, email, category, subject, message } = req.body;

  try {
    const ticket = new SupportTicket({
      user: req.user.userId,
      name,
      email,
      category,
      subject,
      message,
    });

    await ticket.save();

    await emailService.sendEmail({
      to: process.env.EMAIL_FROM,
      subject: `New Support Ticket: ${subject}`,
      text: `New support ticket from ${name} (${email}):\nCategory: ${category}\nMessage: ${message}`,
    });

    logger.info(`Support ticket created by user ${req.user.userId}: ${ticket._id}`);
    res.status(201).json({ success: true, message: 'Support ticket submitted successfully' });
  } catch (err) {
    logger.error(`Create support ticket error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error creating support ticket'));
  }
};

exports.requestWithdrawal = async (req, res, next) => {
  const { amount, method, details } = req.body;

  try {
    const user = await User.findById(req.user.userId);
    if (!user) return next(new ErrorHandler(404, 'User not found'));

    if (amount > user.balance) {
      return next(new ErrorHandler(400, 'Insufficient balance'));
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const payment = new Payment({
      user: req.user.userId,
      amount,
      currency: 'USD',
      type: 'withdrawal',
      status: 'Pending',
      paymentMethod: method,
      transactionId: `WD-${uuidv4()}`,
      details,
      otp,
    });

    await payment.save();

    if (method === 'mpesa') {
      await smsService.sendSMS({
        to: user.phone,
        message: `Your withdrawal OTP is ${otp}. Do not share this code.`,
      });
    } else {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Withdrawal OTP Verification',
        text: `Your withdrawal OTP is ${otp}. Do not share this code.`,
      });
    }

    logger.info(`Withdrawal requested by user ${req.user.userId}: ${payment._id}`);
    res.json({ success: true, message: 'Withdrawal OTP sent', paymentId: payment._id });
  } catch (err) {
    logger.error(`Request withdrawal error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error requesting withdrawal'));
  }
};

exports.verifyWithdrawalOTP = async (req, res, next) => {
  const { amount, method, details, otp } = req.body;

  try {
    const payment = await Payment.findOne({
      user: req.user.userId,
      type: 'withdrawal',
      status: 'Pending',
      amount,
      paymentMethod: method,
      details,
      otp,
    });

    if (!payment) return next(new ErrorHandler(400, 'Invalid OTP or payment details'));

    payment.status = 'Completed';
    await payment.save();

    const user = await User.findById(req.user.userId);
    user.balance -= amount;
    await user.save();

    logger.info(`Withdrawal verified for user ${req.user.userId}: ${payment._id}`);
    res.json({ success: true, message: 'Withdrawal verified successfully' });
  } catch (err) {
    logger.error(`Verify withdrawal OTP error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error verifying withdrawal OTP'));
  }
};



// Debug exports
console.log('userController exports:', module.exports);