const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwtHelper');
const AppError = require('../utils/AppError');

// Helper: build the public user response shape
const formatUser = (user) => ({
  _id: user._id,
  username: user.username,
  displayName: user.displayName || user.username,
  email: user.email,
  bio: user.bio,
  avatar: user.avatar,
  headerImage: user.headerImage,
  followers: user.followers,
  following: user.following,
  homeLocation: user.homeLocation,
  role: user.role,
  joinedDate: user.joinedDate,
});

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { username, email, password, displayName } = req.body;

    if (!username || !email || !password) {
      return next(new AppError('Username, email, and password are required', 400, 'INVALID_INPUT'));
    }

    if (username.length < 3 || username.length > 30) {
      return next(new AppError('Username must be between 3 and 30 characters', 400, 'INVALID_INPUT'));
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return next(new AppError('Username may only contain letters, numbers, and underscores', 400, 'INVALID_INPUT'));
    }

    if (password.length < 6) {
      return next(new AppError('Password must be at least 6 characters long', 400, 'INVALID_INPUT'));
    }

    const emailLower = email.toLowerCase();
    const usernameLower = username.toLowerCase();

    const emailExists = await User.exists({ email: emailLower });
    if (emailExists) {
      return next(new AppError('Email is already registered', 400, 'DUPLICATE_EMAIL'));
    }

    const usernameExists = await User.exists({ username: usernameLower });
    if (usernameExists) {
      return next(new AppError('Username is already taken', 400, 'DUPLICATE_USERNAME'));
    }

    const newUser = await User.create({
      username: usernameLower,
      displayName: displayName ? displayName.trim() : username,
      email: emailLower,
      password,
      role: 'user',
    });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: formatUser(newUser),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return next(new AppError('Email/Username and password are required', 400, 'INVALID_INPUT'));
    }

    const inputNormalized = emailOrUsername.toLowerCase();

    const user = await User.findOne({
      $or: [
        { email: inputNormalized },
        { username: inputNormalized },
      ],
    }).select('+password');

    if (!user) {
      return next(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: formatUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh
const refreshSession = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return next(new AppError('Refresh token is required', 400, 'INVALID_INPUT'));
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      return next(new AppError('Invalid or expired refresh token', 401, 'INVALID_TOKEN'));
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new AppError('User not found', 404, 'NOT_FOUND'));
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        user: formatUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
const logoutSession = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

module.exports = {
  register,
  login,
  refreshSession,
  logoutSession,
};
