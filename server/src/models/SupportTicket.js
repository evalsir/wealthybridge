// server/src/models/SupportTicket.js
const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  category: {
    type: String,
    enum: ['General', 'Account', 'Payments', 'Technical', 'Other'],
    required: true,
  },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open',
  },
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);