//mongodb connection setup
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected successfully');
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    throw err;
  }
};

module.exports = { connectDB };