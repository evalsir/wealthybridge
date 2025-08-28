// server.js
require('dotenv').config();
const app = require('./src/index');
const { connectDB } = require('./src/config/db');
const logger = require('./src/utils/logger');
const cronJobs = require('./src/utils/cronJobs');
const Plan = require('./src/models/Plan');
const Config = require('./src/models/Config');
const { plans } = require('./src/utils/constants');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    // Seed plans if not exist
    const planCount = await Plan.countDocuments();
    if (planCount === 0) {
      await Plan.insertMany(plans);
      logger.info('Investment plans seeded');
    }

    // Seed config if not exist
    await Config.findOneAndUpdate({}, { maintenance: false }, { upsert: true, setDefaultsOnInsert: true });
    logger.info('App config initialized');

    cronJobs.start(); // Start cron jobs for auto-reinvest and daily reset

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error(`Server startup error: ${err.message}`);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  cronJobs.stop();
  process.exit(0);
});