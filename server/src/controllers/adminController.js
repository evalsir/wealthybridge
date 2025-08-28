// backend/src/controllers/adminController.js
const User = require('../models/User');
const Payment = require('../models/Payment');
const Investment = require('../models/Investment');
const Config = require('../models/Config');
const Content = require('../models/Content');
const ErrorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const { paypalUnsupportedCountryCodes } = require('../utils/constants');

// Get Dashboard Stats for StatsCards.jsx
exports.getDashboardStats = async (req, res, next) => {
  try {
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const totalSharesRunning = await Investment.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
    ]);

    const sharesSold = await Payment.aggregate([
      { $match: { status: 'success', type: 'investment' } },
      { $group: { _id: null, totalSold: { $sum: '$amount' } } },
    ]);

    const sharesSoldLastWeek = await Payment.aggregate([
      { $match: { status: 'success', type: 'investment', createdAt: { $gte: lastWeek } } },
      { $group: { _id: null, totalSold: { $sum: '$amount' } } },
    ]);

    const newClients = await User.countDocuments({ createdAt: { $gte: lastWeek } });
    const totalClients = await User.countDocuments();

    const newClientsLastWeek = await User.countDocuments({
      createdAt: { $gte: new Date(lastWeek - 7 * 24 * 60 * 60 * 1000), $lte: lastWeek },
    });

    const stats = [
      {
        title: 'Total Shares Running',
        value: `$${totalSharesRunning[0]?.totalAmount.toLocaleString() || '0'}`,
        change: totalSharesRunning[0]?.totalAmount ? '+0%' : '0%',
        bg: 'bg-green-100 text-green-700',
      },
      {
        title: 'Shares Sold',
        value: `$${sharesSold[0]?.totalSold.toLocaleString() || '0'}`,
        change: sharesSoldLastWeek[0]?.totalSold
          ? `+${((sharesSold[0].totalSold - sharesSoldLastWeek[0].totalSold) / sharesSoldLastWeek[0].totalSold * 100).toFixed(1)}%`
          : '0%',
        bg: 'bg-blue-100 text-blue-700',
      },
      {
        title: 'New Clients',
        value: newClients.toLocaleString(),
        change: newClientsLastWeek
          ? `+${((newClients - newClientsLastWeek) / newClientsLastWeek * 100).toFixed(1)}%`
          : '0%',
        bg: 'bg-yellow-100 text-yellow-800',
      },
      {
        title: 'Total Clients',
        value: totalClients.toLocaleString('en-US', { notation: 'compact' }),
        change: totalClients ? '+2.5%' : '0%', // Simplified for demo
        bg: 'bg-purple-100 text-purple-800',
      },
    ];

    res.json({ success: true, stats });
  } catch (err) {
    logger.error(`Get dashboard stats error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error fetching dashboard stats'));
  }
};

// Get Recent Activity for RecentActivity.jsx
exports.getRecentActivity = async (req, res, next) => {
  try {
    const recentUsers = await User.find({}).sort({ createdAt: -1 }).limit(2);
    const recentPayments = await Payment.find({}).sort({ createdAt: -1 }).limit(2);
    const recentInvestments = await Investment.find({}).sort({ createdAt: -1 }).limit(2);
    const recentContent = await Content.find({}).sort({ updatedAt: -1 }).limit(2);

    const activities = [
      ...recentUsers.map(user => ({
        icon: 'UserCheck',
        title: 'New User Approved',
        description: `${user.firstName} ${user.lastName} was approved.`,
        time: new Date(user.createdAt).toLocaleTimeString(),
      })),
      ...recentPayments.map(payment => ({
        icon: 'CreditCard',
        title: 'Payment Received',
        description: `${payment.amount} ${payment.currency} from user ID: ${payment.user}.`,
        time: new Date(payment.createdAt).toLocaleTimeString(),
      })),
      ...recentInvestments.map(investment => ({
        icon: 'TrendingUp',
        title: 'New Investment',
        description: `${investment.amount} ${investment.currency} invested by user ID: ${investment.user}.`,
        time: new Date(investment.createdAt).toLocaleTimeString(),
      })),
      ...recentContent.map(content => ({
        icon: 'FileText',
        title: 'Content Updated',
        description: `${content.title} updated.`,
        time: new Date(content.updatedAt).toLocaleTimeString(),
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 4);

    res.json({ success: true, activities });
  } catch (err) {
    logger.error(`Get recent activity error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error fetching recent activity'));
  }
};

// Get Revenue Trends for Charts.jsx
exports.getRevenueTrends = async (req, res, next) => {
  try {
    const revenueTrends = await Payment.aggregate([
      {
        $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          users: { $addToSet: '$user' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const trends = revenueTrends.map(trend => ({
      name: new Date(trend._id).toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: trend.revenue,
      users: trend.users.length,
    }));

    // Ensure 7 days of data
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today - i * 24 * 60 * 60 * 1000);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }).reverse();

    const filledTrends = last7Days.map(day => {
      const existing = trends.find(t => t.name === day);
      return existing || { name: day, revenue: 0, users: 0 };
    });

    res.json({ success: true, trends: filledTrends });
  } catch (err) {
    logger.error(`Get revenue trends error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error fetching revenue trends'));
  }
};

// Get Users for UserTable.jsx
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('firstName lastName email role status lastLogin avatar');
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      status: user.emailVerified && user.phoneVerified ? 'Active' : 'Inactive',
      lastLogin: user.lastLogin ? new Date(user.lastLogin).toISOString().split('T')[0] : 'N/A',
      avatar: user.avatar || `${user.firstName[0]}${user.lastName[0]}`,
    }));
    res.json({ success: true, users: formattedUsers });
  } catch (err) {
    logger.error(`Get users error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error fetching users'));
  }
};

// Create User for UserForm.jsx
exports.createUser = async (req, res, next) => {
  const {
    firstName,
    lastName,
    username,
    email,
    countryCode,
    phone,
    password,
    role,
    status,
    bio,
  } = req.body;

  try {
    if (paypalUnsupportedCountryCodes.includes(countryCode.toUpperCase())) {
      return next(new ErrorHandler(400, 'Country not supported by PayPal'));
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) return next(new ErrorHandler(400, 'User already exists'));

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      firstName,
      lastName,
      username,
      email,
      countryCode: countryCode.toUpperCase(),
      phone: `${countryCode}${phone}`,
      password: hashedPassword,
      role: role || 'User',
      status: status || 'Active',
      bio,
      emailVerified: true, // Admin-created users are auto-verified
      phoneVerified: true,
      createdBy: req.user.userId, // Admin who created the user
    });

    await user.save();

    logger.info(`User ${username} created by admin ${req.user.userId}`);
    res.status(201).json({ success: true, message: 'User created successfully', userId: user._id });
  } catch (err) {
    logger.error(`Create user error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error creating user'));
  }
};

// Update User for UserForm.jsx
exports.updateUser = async (req, res, next) => {
  const { id } = req.params;
  const {
    firstName,
    lastName,
    username,
    email,
    countryCode,
    phone,
    password,
    role,
    status,
    bio,
  } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return next(new ErrorHandler(404, 'User not found'));

    if (paypalUnsupportedCountryCodes.includes(countryCode.toUpperCase())) {
      return next(new ErrorHandler(400, 'Country not supported by PayPal'));
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
      _id: { $ne: id },
    });
    if (existingUser) return next(new ErrorHandler(400, 'Username or email already exists'));

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.username = username || user.username;
    user.email = email || user.email;
    user.countryCode = countryCode ? countryCode.toUpperCase() : user.countryCode;
    user.phone = phone ? `${countryCode}${phone}` : user.phone;
    if (password) user.password = await bcrypt.hash(password, 12);
    user.role = role || user.role;
    user.status = status || user.status;
    user.bio = bio || user.bio;

    await user.save();

    logger.info(`User ${id} updated by admin ${req.user.userId}`);
    res.json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    logger.error(`Update user error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error updating user'));
  }
};

// Delete User for UserTable.jsx
exports.deleteUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) return next(new ErrorHandler(404, 'User not found'));

    await user.remove();
    logger.info(`User ${id} deleted by admin ${req.user.userId}`);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    logger.error(`Delete user error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error deleting user'));
  }
};

// Get User Details for UserTable.jsx
exports.getUserDetails = async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id).select('firstName lastName username email countryCode phone role status bio');
    if (!user) return next(new ErrorHandler(404, 'User not found'));

    res.json({
      success: true,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        countryCode: user.countryCode,
        phone: user.phone,
        role: user.role,
        status: user.status,
        bio: user.bio,
      },
    });
  } catch (err) {
    logger.error(`Get user details error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error fetching user details'));
  }
};

// Get Config for SettingsForm.jsx
exports.getConfig = async (req, res, next) => {
  try {
    const config = await Config.findOne();
    if (!config) return next(new ErrorHandler(404, 'Config not found'));

    res.json({ success: true, config });
  } catch (err) {
    logger.error(`Get config error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error fetching config'));
  }
};

// Update Config for SettingsForm.jsx
exports.updateConfig = async (req, res, next) => {
  try {
    const { siteName, siteUrl, language, timezone, maintenanceMode, registrationEnabled, emailNotifications, smsNotifications } = req.body;

    const config = await Config.findOneAndUpdate(
      {},
      { siteName, siteUrl, language, timezone, maintenanceMode, registrationEnabled, emailNotifications, smsNotifications },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    logger.info(`Config updated by admin ${req.user.userId}`);
    res.json({ success: true, config });
  } catch (err) {
    logger.error(`Update config error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error updating config'));
  }
};

// Get Analytics Overview for Analytics.jsx
exports.getAnalyticsOverview = async (req, res, next) => {
  try {
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const lastMonthRevenue = await Payment.aggregate([
      { $match: { status: 'success', createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const activeUsers = await User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
    const lastMonthActiveUsers = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), $lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    const conversions = await Investment.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
    const lastMonthConversions = await Investment.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), $lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    const totalRevenueValue = totalRevenue[0]?.total || 0;
    const revenueChange = lastMonthRevenue[0]?.total
      ? ((totalRevenueValue - lastMonthRevenue[0].total) / lastMonthRevenue[0].total * 100).toFixed(1)
      : 0;

    const activeUsersChange = lastMonthActiveUsers
      ? ((activeUsers - lastMonthActiveUsers) / lastMonthActiveUsers * 100).toFixed(1)
      : 0;

    const conversionRate = activeUsers ? (conversions / activeUsers * 100).toFixed(1) : 0;
    const lastMonthConversionRate = lastMonthActiveUsers ? (lastMonthConversions / lastMonthActiveUsers * 100).toFixed(1) : 0;
    const conversionChange = lastMonthConversionRate ? (conversionRate - lastMonthConversionRate).toFixed(1) : 0;

    // Placeholder for session duration (requires session tracking)
    const avgSession = '4m 32s';
    const sessionChange = '-0.4%';

    const overview = [
      {
        title: 'Total Revenue',
        value: `$${totalRevenueValue.toLocaleString()}`,
        change: `+${revenueChange}%`,
      },
      {
        title: 'Active Users',
        value: activeUsers.toLocaleString(),
        change: `+${activeUsersChange}%`,
      },
      {
        title: 'Conversion Rate',
        value: `${conversionRate}%`,
        change: `+${conversionChange}%`,
      },
      {
        title: 'Avg. Session',
        value: avgSession,
        change: sessionChange,
      },
    ];

    res.json({ success: true, overview });
  } catch (err) {
    logger.error(`Get analytics overview error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error fetching analytics overview'));
  }
};

// Get Content for Content.jsx
exports.getContent = async (req, res, next) => {
  try {
    const content = await Content.find().populate('createdBy', 'firstName lastName');
    res.json({ success: true, content });
  } catch (err) {
    logger.error(`Get content error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error fetching content'));
  }
};

// Create Content for Content.jsx
exports.createContent = async (req, res, next) => {
  const { type, title, description, status, metadata } = req.body;

  try {
    const content = new Content({
      type,
      title,
      description,
      status,
      metadata,
      createdBy: req.user.userId,
    });

    await content.save();
    logger.info(`Content ${title} created by admin ${req.user.userId}`);
    res.status(201).json({ success: true, message: 'Content created successfully', contentId: content._id });
  } catch (err) {
    logger.error(`Create content error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error creating content'));
  }
};

// Update Content for Content.jsx
exports.updateContent = async (req, res, next) => {
  const { id } = req.params;
  const { type, title, description, status, metadata } = req.body;

  try {
    const content = await Content.findById(id);
    if (!content) return next(new ErrorHandler(404, 'Content not found'));

    content.type = type || content.type;
    content.title = title || content.title;
    content.description = description || content.description;
    content.status = status || content.status;
    content.metadata = metadata || content.metadata;

    await content.save();
    logger.info(`Content ${id} updated by admin ${req.user.userId}`);
    res.json({ success: true, message: 'Content updated successfully' });
  } catch (err) {
    logger.error(`Update content error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error updating content'));
  }
};

// Delete Content for Content.jsx
exports.deleteContent = async (req, res, next) => {
  const { id } = req.params;

  try {
    const content = await Content.findById(id);
    if (!content) return next(new ErrorHandler(404, 'Content not found'));

    await content.remove();
    logger.info(`Content ${id} deleted by admin ${req.user.userId}`);
    res.json({ success: true, message: 'Content deleted successfully' });
  } catch (err) {
    logger.error(`Delete content error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error deleting content'));
  }
};

// Get Admin Profile for Profile.jsx
exports.getAdminProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('firstName lastName email role phone countryCode createdAt');
    if (!user) return next(new ErrorHandler(404, 'User not found'));

    res.json({
      success: true,
      profile: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: 'N/A', // Update with actual location if available
        joinDate: new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        avatar: `${user.firstName[0]}${user.lastName[0]}`,
      },
    });
  } catch (err) {
    logger.error(`Get admin profile error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error fetching admin profile'));
  }
};

// Update Admin Profile for Profile.jsx
exports.updateAdminProfile = async (req, res, next) => {
  const { firstName, lastName, email, phone, countryCode, password } = req.body;

  try {
    const user = await User.findById(req.user.userId);
    if (!user) return next(new ErrorHandler(404, 'User not found'));

    if (paypalUnsupportedCountryCodes.includes(countryCode.toUpperCase())) {
      return next(new ErrorHandler(400, 'Country not supported by PayPal'));
    }

    const existingUser = await User.findOne({
      $or: [{ email }],
      _id: { $ne: req.user.userId },
    });
    if (existingUser) return next(new ErrorHandler(400, 'Email already exists'));

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.phone = phone ? `${countryCode}${phone}` : user.phone;
    user.countryCode = countryCode ? countryCode.toUpperCase() : user.countryCode;
    if (password) user.password = await bcrypt.hash(password, 12);

    await user.save();
    logger.info(`Admin profile ${req.user.userId} updated`);
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    logger.error(`Update admin profile error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error updating admin profile'));
  }
};

// Get Admin Activity for Profile.jsx
exports.getAdminActivity = async (req, res, next) => {
  try {
    // Placeholder: Track admin actions in a new Activity model or log
    const activities = [
      {
        title: 'Updated user permissions',
        description: 'Modified access for 3 users',
        time: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleTimeString(),
      },
      {
        title: 'Generated analytics report',
        description: 'Monthly performance summary',
        time: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleTimeString(),
      },
      {
        title: 'System maintenance completed',
        description: 'Updated security configurations',
        time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleTimeString(),
      },
    ];

    res.json({ success: true, activities });
  } catch (err) {
    logger.error(`Get admin activity error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error fetching admin activity'));
  }
};

// Get Transactions for Transactions.jsx
exports.getTransactions = async (req, res, next) => {
  try {
    const { status } = req.query; // Filter by status: all, completed, pending, failed
    const query = status && status !== 'all' ? { status: status.charAt(0).toUpperCase() + status.slice(1) } : {};

    const transactions = await Payment.find(query)
      .populate('user', 'firstName lastName')
      .sort({ createdAt: -1 });

    const formattedTransactions = transactions.map(txn => ({
      id: txn._id,
      name: `${txn.user?.firstName} ${txn.user?.lastName}` || 'Unknown',
      withdrawal: txn.type === 'withdrawal' ? `$${txn.amount.toLocaleString()}` : '$0',
      deposit: txn.type === 'investment' || txn.type === 'verification' ? `$${txn.amount.toLocaleString()}` : '$0',
      status: txn.status,
      date: new Date(txn.createdAt).toISOString().split('T')[0],
    }));

    res.json({ success: true, transactions: formattedTransactions });
  } catch (err) {
    logger.error(`Get transactions error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error fetching transactions'));
  }
};

// Approve Transaction for Transactions.jsx
exports.approveTransaction = async (req, res, next) => {
  const { id } = req.params;

  try {
    const payment = await Payment.findById(id);
    if (!payment) return next(new ErrorHandler(404, 'Transaction not found'));

    if (payment.status !== 'Pending') return next(new ErrorHandler(400, 'Transaction cannot be approved'));

    payment.status = 'Completed';
    await payment.save();

    logger.info(`Transaction ${id} approved by admin ${req.user.userId}`);
    res.json({ success: true, message: 'Transaction approved successfully' });
  } catch (err) {
    logger.error(`Approve transaction error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error approving transaction'));
  }
};

// Cancel Transaction for Transactions.jsx
exports.cancelTransaction = async (req, res, next) => {
  const { id } = req.params;

  try {
    const payment = await Payment.findById(id);
    if (!payment) return next(new ErrorHandler(404, 'Transaction not found'));

    if (payment.status !== 'Pending') return next(new ErrorHandler(400, 'Transaction cannot be cancelled'));

    payment.status = 'Failed';
    await payment.save();

    logger.info(`Transaction ${id} cancelled by admin ${req.user.userId}`);
    res.json({ success: true, message: 'Transaction cancelled successfully' });
  } catch (err) {
    logger.error(`Cancel transaction error: ${err.message}`);
    next(new ErrorHandler(500, 'Server error cancelling transaction'));
  }
};


// Debug exports
console.log('adminController exports:', module.exports);