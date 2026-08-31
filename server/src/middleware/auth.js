const { verifyAccessToken } = require('../utils/jwtHelper');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please create a session.', 401, 'UNAUTHORIZED'));
    }

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return next(new AppError('Session expired or invalid. Please refresh session.', 401, 'SESSION_EXPIRED'));
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new AppError('User not found. Please register again.', 401, 'USER_NOT_FOUND'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        const user = await User.findById(decoded.userId);
        if (user) {
          req.user = user;
        }
      }
    }
    next();
  } catch (error) {
    // Fail silently for optional auth
    next();
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    next(new AppError('Access denied. Moderator rights required.', 403, 'FORBIDDEN'));
  }
};

module.exports = {
  protect,
  optionalAuth,
  isAdmin
};
