const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  duration: { type: Number, required: true }, // days
  profit: { type: Number, required: true }, // percent
  minShares: { type: Number, required: true },
  maxShares: { type: Number, required: true },
  dailyLimit: { type: Number, required: true }, // shares
  dailySold: { type: Number, default: 0 }, // Reset daily via cron
}, { timestamps: true });

// Pre-save or methods if needed

module.exports = mongoose.model('Plan', planSchema);