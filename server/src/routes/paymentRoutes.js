// server/src/routes/paymentRoutes.js
const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { processPayment, capturePayment } = require('../controllers/paymentController');
const { processPaymentCallback } = require('../controllers/authController'); // Import processPaymentCallback
const { validatePaymentCallback } = require('../middlewares/validationMiddleware'); // Import validation
const logger = require('../utils/logger');

const router = express.Router();

// Debug imports
console.log('paymentController in paymentRoutes:', { processPayment, capturePayment });
console.log('authController in paymentRoutes:', { processPaymentCallback });
console.log('validationMiddleware in paymentRoutes:', { validatePaymentCallback });

// Routes for payment functionality
router.post('/process', protect, processPayment);
router.post('/capture/:gateway', protect, capturePayment);
router.post('/callback/:gateway', protect, validatePaymentCallback, processPaymentCallback);

// Debug: Log all routes
router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    logger.info(`Registered payment route: ${Object.keys(r.route.methods).join(',')} ${r.route.path}`);
  }
});

module.exports = router;

// Debug: Log module exports
console.log('paymentRoutes exports:', module.exports);