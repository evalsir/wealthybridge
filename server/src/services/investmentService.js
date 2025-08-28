const Investment = require('../models/Investment');
const Plan = require('../models/Plan');
const User = require('../models/User');
const Referral = require('../models/Referral');
const { referralBonusPercent } = require('../config');
const logger = require('../utils/logger');

// Check and update daily limit
exports.checkDailyLimit = async (planId, shares) => {
  const plan = await Plan.findById(planId);
  if (plan.dailySold + shares > plan.dailyLimit) return false;
  plan.dailySold += shares;
  await plan.save();
  return true;
};

// Handle referral bonus on first investment
exports.handleReferralBonus = async (userId, investmentAmount) => {
  const user = await User.findById(userId);
  if (!user.referredBy) return;

  const referrer = await User.findOne({ referralCode: user.referredBy });
  if (!referrer) return;

  let referral = await Referral.findOne({ referrer: referrer._id, referred: userId });
  if (!referral) {
    referral = new Referral({ referrer: referrer._id, referred: userId });
    await referral.save();
  }

  if (!referral.firstInvestment) {
    const bonus = investmentAmount * (referralBonusPercent / 100);
    referrer.balance += bonus;
    await referrer.save();

    referral.bonusAmount = bonus;
    referral.firstInvestment = true;
    await referral.save();

    logger.info(`Referral bonus ${bonus} added to referrer ${referrer._id}`);
  }
};

// Auto-reinvest matured investments after 24 hours
exports.autoReinvest = async () => {
  const now = new Date();
  const matured = await Investment.find({
    status: 'matured',
    autoReinvested: false,
    endDate: { $lt: new Date(now - require('../config').autoReinvestHours * 60 * 60 * 1000) },
  });

  for (const inv of matured) {
    const newInv = new Investment({
      user: inv.user,
      plan: inv.plan,
      shares: inv.shares,
      amount: inv.amount,
      startDate: now,
      endDate: new Date(now.getTime() + (inv.endDate - inv.startDate)),
      profitPercent: inv.profitPercent,
      status: 'active',
    });
    await newInv.save();

    inv.autoReinvested = true;
    await inv.save();

    logger.info(`Auto-reinvested investment ${inv._id} for user ${inv.user}`);
  }
};