const Investment = require('../models/Investment');
const Plan = require('../models/Plan');
const User = require('../models/User');
const paymentService = require('../services/paymentService');
const investmentService = require('../services/investmentService');
const ErrorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { sharePrice, cancelPenaltyPercent } = require('../config');

// Get all plans
exports.getPlans = async (req, res, next) => {
  try {
    const plans = await Plan.find();
    res.json(plans);
  } catch (err) {
    logger.error(`Get plans error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error during fetching plans'));
  }
};

// Create investment
exports.invest = async (req, res, next)=> {
  const { planId, shares, paymentGateway, paymentDetails, currency = 'USD' } = req.body;
  const userId = req.user._id;

  try {
    const plan = await Plan.findById(planId);
    if (!plan) return next(new ErrorHandler(404, 'Plan not found'));

    if (shares < plan.minShares || shares > plan.maxShares) return next(new ErrorHandler(400, 'Invalid share count'));

    const existing = await Investment.findOne({ user: userId, plan: planId, status: { $ne: 'matured' } });
    if (existing) return next(new ErrorHandler(400, 'Active investment in this plan exists'));

    const available = await investmentService.checkDailyLimit(planId, shares);
    if (!available) return next(new ErrorHandler(400, 'Daily limit exceeded'));

    const amount = shares * sharePrice; // USD

    const transaction = await paymentService.processPayment({
      amount,
      currency,
      gateway: paymentGateway,
      details: paymentDetails,
      type: 'investment',
      userId,
      planId,
      shares,
    });

    if (!transaction.success) return next(new ErrorHandler(400, 'Payment failed for investment'));

    const investment = new Investment({
      user: userId,
      plan: planId,
      shares,
      amount,
      startDate: new Date(),
      endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000),
      profitPercent: plan.profit,
      status: 'active',
      transactionId: transaction.transactionId,
    });

    await investment.save();

    await investmentService.handleReferralBonus(userId, amount);

    logger.info(`User ${userId} invested in plan ${planId}`);
    res.json({ message: 'Investment successful', investment });
  } catch (err) {
    logger.error(`Invest error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error during investment'));
  }
};

// Cancel investment (with 30% penalty)
exports.cancel = async (req, res, next) =>{
  const { investmentId } = req.params;
  const userId = req.user._id;

  try {
    const investment = await Investment.findOne({ _id: investmentId, user: userId });
    if (!investment) return next(new ErrorHandler(404, 'Investment not found'));
    if (investment.status !== 'active') return next(new ErrorHandler(400, 'Investment not active'));

    const penalty = investment.amount * (cancelPenaltyPercent / 100);
    const refund = investment.amount - penalty;

    const refundTransaction = await paymentService.processRefund({
      amount: refund,
      currency: 'USD',
      originalTransactionId: investment.transactionId,
      userId,
    });

    if (!refundTransaction.success) return next(new ErrorHandler(400, 'Refund failed'));

    investment.status = 'cancelled';
    investment.refundAmount = refund;
    await investment.save();

    logger.info(`User ${userId} cancelled investment ${investmentId} with penalty ${penalty}`);
    res.json({ message: 'Investment cancelled with penalty', refund, penalty });
  } catch (err) {
    logger.error(`Cancel investment error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error during cancellation'));
  }
};

// Withdraw matured investment
exports.withdraw = async (req, res, next)=> {
  const { investmentId, paymentGateway, paymentDetails, currency = 'USD' } = req.body;
  const userId = req.user._id;

  try {
    const investment = await Investment.findOne({ _id: investmentId, user: userId });
    if (!investment) return next(new ErrorHandler(404, 'Investment not found'));
    if (investment.status !== 'matured') return next(new ErrorHandler(400, 'Investment not matured'));

    const profit = investment.amount * (investment.profitPercent / 100);
    const total = investment.amount + profit;

    const transaction = await paymentService.processWithdrawal({
      amount: total,
      currency,
      gateway: paymentGateway,
      details: paymentDetails,
      userId,
    });

    if (!transaction.success) return next(new ErrorHandler(400, 'Withdrawal failed'));

    investment.status = 'withdrawn';
    await investment.save();

    logger.info(`User ${userId} withdrew from investment ${investmentId}`);
    res.json({ message: 'Withdrawal successful', amount: total });
  } catch (err) {
    logger.error(`Withdraw error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error during withdrawal'));
  }
};