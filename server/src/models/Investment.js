const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  shares: { type: Number, required: true },
  amount: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  profitPercent: { type: Number, required: true },
  status: { type: String, enum: ['active', 'matured', 'cancelled','withdrawn'], default: 'active' },
  refundAmount: { type: Number },
  transactionId: { type: String }, // From payment
  autoReinvested: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Investment', investmentSchema);