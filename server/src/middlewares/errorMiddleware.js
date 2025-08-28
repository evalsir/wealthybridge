// server/src/middlewares/errorMiddleware.js
const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Server error';
  const response = { error: message };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack; // Include stack trace in development
  }

  logger.error(`${req.method} ${req.url} - ${status} - ${message}`, {
    stack: err.stack,
    origin: req.get('Origin'),
    body: req.body,
    headers: req.headers,
  });

  const allowedOrigins = [
    process.env.CLIENT_URL || 'https://ef8873279cee.ngrok-free.app',
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  const origin = req.get('Origin');
  if (origin && allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Credentials', 'true');
  }

  res.status(status).json(response);
};