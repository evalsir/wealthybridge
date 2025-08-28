// src/routes/paymentRoutes.js
const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { processPayment, capturePayment, paymentCallback } = require('../controllers/paymentController');

const router = express.Router();

// Debug import
console.log('paymentController in paymentRoutes:', { processPayment, capturePayment, paymentCallback });

// Routes for payment functionality
router.post('/process', protect, processPayment); // Line 7
router.post('/capture/:gateway', protect, capturePayment); // Line 8
router.post('/callback/:gateway', paymentCallback); // Line 9: Fixed to use paymentCallback

module.exports = router;