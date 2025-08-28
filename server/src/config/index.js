//central config export e.g env variable
module.exports = {
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: process.env.JWT_EXPIRATION,
  verificationFee: parseFloat(process.env.VERIFICATION_FEE),
  sharePrice: parseFloat(process.env.SHARE_PRICE),
  referralBonusPercent: parseFloat(process.env.REFERRAL_BONUS_PERCENT),
  autoReinvestHours: parseInt(process.env.AUTO_REINVEST_HOURS),
  cancelPenaltyPercent: parseFloat(process.env.CANCEL_PENALTY_PERCENT),
  // Add more as needed
};