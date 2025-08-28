// backend/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const {
  getDashboardStats,
  getRecentActivity,
  getRevenueTrends,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserDetails,
  getConfig,
  updateConfig,
  getAnalyticsOverview,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  getAdminProfile,
  updateAdminProfile,
  getAdminActivity,
  getTransactions,
  approveTransaction,
  cancelTransaction,
} = require('../controllers/adminController');

// Debug import
console.log('adminController in adminRoutes:', {
  getDashboardStats,
  getRecentActivity,
  getRevenueTrends,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserDetails,
  updateConfig,
  getAnalyticsOverview,
  getContent,
  createContent,
  updateContent,
  deleteContent,
  getAdminProfile,
  updateAdminProfile,
  getAdminActivity,
  getTransactions,
  approveTransaction,
  cancelTransaction,
});

// Dashboard routes
router.get('/dashboard/stats', protect, isAdmin, getDashboardStats); // For StatsCards.jsx
router.get('/dashboard/recent-activity', protect, isAdmin, getRecentActivity); // For RecentActivity.jsx
router.get('/dashboard/revenue-trends', protect, isAdmin, getRevenueTrends); // For Charts.jsx

// User management routes
router.get('/users', protect, isAdmin, getUsers); // For UserTable.jsx
router.post('/users', protect, isAdmin, createUser); // For UserForm.jsx (create)
router.put('/users/:id', protect, isAdmin, updateUser); // For UserForm.jsx (edit)
router.delete('/users/:id', protect, isAdmin, deleteUser); // For UserTable.jsx (delete)
router.get('/users/:id', protect, isAdmin, getUserDetails); // For UserTable.jsx (view)

// Settings routes
router.get('/config', protect, isAdmin, getConfig); // For SettingsForm.jsx
router.post('/config', protect, isAdmin, updateConfig); // For SettingsForm.jsx

// Analytics routes
router.get('/analytics/overview', protect, isAdmin, getAnalyticsOverview); // For Analytics.jsx

// Content management routes
router.get('/content', protect, isAdmin, getContent); // For Content.jsx
router.post('/content', protect, isAdmin, createContent); // For Content.jsx
router.put('/content/:id', protect, isAdmin, updateContent); // For Content.jsx
router.delete('/content/:id', protect, isAdmin, deleteContent); // For Content.jsx

// Profile routes
router.get('/profile', protect, isAdmin, getAdminProfile); // For Profile.jsx
router.put('/profile', protect, isAdmin, updateAdminProfile); // For Profile.jsx
router.get('/profile/activity', protect, isAdmin, getAdminActivity); // For Profile.jsx

// Transaction routes
router.get('/transactions', protect, isAdmin, getTransactions); // For Transactions.jsx
router.post('/transactions/:id/approve', protect, isAdmin, approveTransaction); // For Transactions.jsx
router.post('/transactions/:id/cancel', protect, isAdmin, cancelTransaction); // For Transactions.jsx

module.exports = router;