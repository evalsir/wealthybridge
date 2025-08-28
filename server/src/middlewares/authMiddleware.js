//src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const User = require('../models/User');
const ErrorHandler = require('../utils/errorHandler');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next(new ErrorHandler(401, 'Not authorized, no token'));

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = await User.findById(decoded.userId);
    if (!req.user) return next(new ErrorHandler(401, 'User not found'));
    next();
  } catch (err) {
    next(new ErrorHandler(401, 'Invalid token'));
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return next(new ErrorHandler(403, 'Admin role required'));
  next();
};