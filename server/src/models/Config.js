const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({

 // maintenance: { type: Boolean, default: false },
siteName: { type: String, default: 'WealthyBridge Admin' },
  siteUrl: { type: String, default: 'https://admin.wealthybridge.com' },
  language: { type: String, default: 'en', enum: ['en', 'es', 'fr', 'de'] },
  timezone: { type: String, default: 'UTC', enum: ['UTC', 'EST', 'PST', 'CET'] },
  maintenanceMode: { type: Boolean, default: false },
  registrationEnabled: { type: Boolean, default: true },
  emailNotifications: { type: Boolean, default: true },
  smsNotifications: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Config', configSchema);