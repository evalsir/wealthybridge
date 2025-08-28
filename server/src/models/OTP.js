// server/src/models/OTP.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: ['email', 'phone', '2fa', 'password_reset'] },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model('OTP', otpSchema);