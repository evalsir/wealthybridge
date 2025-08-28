const cron = require('node-cron');
const investmentService = require('../services/investmentService');
const Plan = require('../models/Plan');
const logger = require('./logger');

// Daily reset of dailySold at midnight
const resetDailyLimits = async () => {
  await Plan.updateMany({}, { dailySold: 0 });
  logger.info('Daily limits reset');
};

// Check for matured investments every hour
const checkMatured = async () => {
  const now = new Date();
  await Investment.updateMany({ endDate: { $lt: now }, status: 'active' }, { status: 'matured' });
  logger.info('Matured investments updated');
};

// Auto reinvest every hour
const runAutoReinvest = async () => {
  await investmentService.autoReinvest();
};

exports.start = () => {
  cron.schedule('0 0 * * *', resetDailyLimits); // Midnight daily
  cron.schedule('0 * * * *', checkMatured); // Hourly
  cron.schedule('30 * * * *', runAutoReinvest); // Half past hourly
  logger.info('Cron jobs started');
};

exports.stop = () => {
  cron.getTasks().forEach(task => task.stop());
  logger.info('Cron jobs stopped');
};