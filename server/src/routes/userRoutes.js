// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {getUserStats,
  getUserActivity,
  getInvestments,
  createInvestment,
  cancelInvestment,
  getProfile,
  updateProfile,
  createSupportTicket,
  getReferrals,
  createReferral,
  requestWithdrawal,
  verifyWithdrawalOTP,}= require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

// Debug import
console.log('userController in userRoutes:',{
  getUserStats,
  getUserActivity,
  getInvestments,
  createInvestment,
  cancelInvestment,
  getProfile,
  updateProfile,
  createSupportTicket,
  createReferral,
  requestWithdrawal,
  verifyWithdrawalOTP,
});// userController);
// Routes for referral functionality
router.post('/referrals', authMiddleware.protect, createReferral); // Line 11: Fixed to use protect
router.get('/referrals', authMiddleware.protect, getReferrals);

// User Dashboard routes
router.get('/stats', authMiddleware.protect, getUserStats); // For Overview.jsx
router.get('/activity', authMiddleware.protect, getUserActivity); // For Overview.jsx
router.get('/investments', authMiddleware.protect, getInvestments); // For Earnings.jsx, History.jsx, ManageInvestments.jsx
router.post('/investments', authMiddleware.protect, createInvestment); // For BuyShares.jsx
router.post('/investments/:id/cancel', authMiddleware.protect, cancelInvestment); // For ManageInvestments.jsx
router.get('/profile', authMiddleware.protect, getProfile); // For Profile.jsx
router.put('/profile', authMiddleware.protect, updateProfile); // For Profile.jsx
router.post('/support', authMiddleware.protect, createSupportTicket); // For Support.jsx
//router.post('/')
router.post('/withdraw', authMiddleware.protect, requestWithdrawal); // For Withdraw.jsx
router.post('/withdraw/verify', authMiddleware.protect, verifyWithdrawalOTP); // For Withdraw.jsx

module.exports = router;