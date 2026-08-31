const rateLimit = require('express-rate-limit');

// Helper to create uniform JSON response for rate limits
const limitReachedResponse = (message) => ({
  success: false,
  message,
  code: 'RATE_LIMITED'
});

const defaultWindowMs = 15 * 60 * 1000; // 15 minutes

// Skip limiting during automated test runs
const skipTestEnv = () => process.env.NODE_ENV === 'test';

const sessionLimiter = rateLimit({
  windowMs: defaultWindowMs,
  max: parseInt(process.env.MAX_SESSIONS_PER_WINDOW) || 60, // Max 60 new sessions per 15 mins per IP
  message: limitReachedResponse('Too many sessions created from this IP. Please try again in 15 minutes.'),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipTestEnv,
});

const postLimiter = rateLimit({
  windowMs: defaultWindowMs,
  max: parseInt(process.env.MAX_POSTS_PER_WINDOW) || 10, // Max 10 posts per 15 mins
  message: limitReachedResponse('You are creating posts too fast. Please try again in 15 minutes.'),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipTestEnv,
});

const commentLimiter = rateLimit({
  windowMs: defaultWindowMs,
  max: parseInt(process.env.MAX_COMMENTS_PER_WINDOW) || 20, // Max 20 comments per 15 mins
  message: limitReachedResponse('You are commenting too fast. Please try again in 15 minutes.'),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipTestEnv,
});

const reportLimiter = rateLimit({
  windowMs: defaultWindowMs,
  max: parseInt(process.env.MAX_REPORTS_PER_WINDOW) || 5, // Max 5 reports per 15 mins
  message: limitReachedResponse('You are reporting too fast. Please try again in 15 minutes.'),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipTestEnv,
});

const voteLimiter = rateLimit({
  windowMs: defaultWindowMs,
  max: parseInt(process.env.VOTE_LIMIT_PER_WINDOW) || 100, // Max 100 votes per 15 mins
  message: limitReachedResponse('You are voting too fast. Please slow down.'),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipTestEnv,
});

const searchLimiter = rateLimit({
  windowMs: defaultWindowMs,
  max: 60, // Max 60 searches per 15 mins
  message: limitReachedResponse('Too many searches. Please try again later.'),
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipTestEnv,
});

module.exports = {
  sessionLimiter,
  postLimiter,
  commentLimiter,
  reportLimiter,
  voteLimiter,
  searchLimiter
};
