const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  countryCode: { type: String, required: true },
  phone: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active' },
  bio: { type: String },
  
  referralCode: { type: String, unique: true, required: true },
  referredBy: { type: String },
  acceptTerms: { type: Boolean, required: true },
  enable2FA: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
    hasPaidVerificationFee: { type: Boolean, default: false },
    lastLogin: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  avatar: { type: String },
  preferredPaymentMethod: {
    type: String,
    enum: ['paypal', 'stripe', 'mpesa', 'airtelmoney', 'mtn', 'tigopesa', 'skrill', 'flutterwave', 'googlepay', 'mastercard', ''],
    default: '',
  },
  address: { type: String, default: '' },
  emailOTP: { type: String },
  emailOTPExpires: { type: Date },
  phoneOTP: { type: String },
  phoneOTPExpires: { type: Date },
  twoFAOTP: { type: String },
  twoFAOTPExpires: { type: Date },
  balance: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });


userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  if (!this.referralCode) {
    this.referralCode = `WB${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);