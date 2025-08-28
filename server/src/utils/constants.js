// Generate unique referral code
exports.generateReferralCode = () => 'WB-' + Math.random().toString(36).substring(2, 8).toUpperCase();

// Unsupported PayPal country codes (from 2025 sources, all others supported)
exports.paypalUnsupportedCountryCodes = ['AF', 'BD', 'CM', 'CF', 'CI', 'KP', 'GQ', 'GA', 'GH', 'HT', 'IR', 'IQ', 'LB', 'LR', 'LY', 'MC', 'MD', 'ME', 'MM', 'PK', 'PY', 'TR', 'LC', 'SS', 'SD', 'SY', 'TL', 'UZ', 'ZW'];

// Investment plans data (seeded in DB)
exports.plans = [
  { name: 'Basic 1 Month', duration: 28, profit: 13, minShares: 1, maxShares: 100, dailyLimit: 100000 },
  { name: 'Basic 2 Months', duration: 56, profit: 22, minShares: 2, maxShares: 200, dailyLimit: 200000 },
  { name: 'Premium 3 Months', duration: 84, profit: 27, minShares: 6, maxShares: 300, dailyLimit: 300000 },
  { name: 'Premium 6 Months', duration: 172, profit: 33, minShares: 10, maxShares: 500, dailyLimit: 400000 },
  { name: 'Super 9 Months', duration: 260, profit: 39, minShares: 30, maxShares: 1000, dailyLimit: 500000 },
  { name: 'Super 12 Months', duration: 348, profit: 45, minShares: 50, maxShares: 2000, dailyLimit: 1000000 },
];