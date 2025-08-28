//src/middlewares/maintenanceMiddleware.js

const Config = require('../models/Config');
const ErrorHandler = require('../utils/errorHandler');

module.exports = async (req, res, next) => {
  try {
    const config = await Config.findOne();
    if (config && config.maintenance && !req.path.startsWith('/api/admin')) {
      return res.status(503).json({ error: 'Maintenance in progress' });
    }
    next();
  } catch (err) {
    next(new ErrorHandler(500, 'Server error in maintenance check'));
  }
};