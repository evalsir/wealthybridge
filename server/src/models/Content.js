// backend/src/models/Content.js
const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['plan', 'tip', 'terms', 'bonus', 'testimonial', 'banner'],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  metadata: {
    planPercentage: { type: Number }, // For plans
    duration: { type: String }, // For plans
    expectedReturns: { type: Number }, // For plans
    imageUrl: { type: String }, // For banners, testimonials
    userName: { type: String }, // For testimonials
    priority: { type: Number, default: 0 }, // For sorting banners, plans
  },
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);