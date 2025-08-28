//src/middlewares/errorMiddleware.js
const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Server error';

  logger.error(`${req.method} ${req.url} - ${status} - ${message}`);

  res.status(status).json({ error: message });
};