const express = require('express');
const { getPlans, invest, cancel, withdraw } = require('../controllers/investmentController');
const { protect } = require('../middlewares/authMiddleware');
const { validateInvest, validateWithdraw } = require('../middlewares/validationMiddleware');

const router = express.Router();

router.get('/plans', protect, getPlans);
router.post('/invest', protect, validateInvest, invest);
router.post('/cancel/:investmentId', protect, cancel);
router.post('/withdraw', protect, validateWithdraw, withdraw);

module.exports = router;