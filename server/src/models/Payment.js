const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }, // USD
  localAmount: { type: Number }, // Converted
  currency: { type: String, required: true },
  gateway: { type: String, required: true },
  type: { type: String, enum: ['verification', 'investment', 'withdrawal', 'refund'], required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  transactionId: { type: String },
  details: { type: Object },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
  shares: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);