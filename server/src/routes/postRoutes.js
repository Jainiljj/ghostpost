const express = require('express');
const router = express.Router();
const {
  createPost,
  getGlobalFeed,
  getFollowingFeed,
  getUserPosts,
  getUserReplies,
  getNearbyFeed,
  getHomeFeed,
  getPostDetail,
  deletePost,
  votePost,
  removeVote,
  searchPosts,
} = require('../controllers/postController');
const { getPostComments, createComment } = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middleware/auth');
const { postLimiter, voteLimiter, commentLimiter, searchLimiter } = require('../middleware/rateLimiters');

// Public / Optional-auth feeds
router.get('/global', optionalAuth, getGlobalFeed);
router.get('/nearby', optionalAuth, getNearbyFeed);
router.get('/search', optionalAuth, searchLimiter, searchPosts);

// Protected feeds (must be before dynamic :id route)
router.get('/home', protect, getHomeFeed);
router.get('/following', protect, getFollowingFeed);

// User-specific post listings
router.get('/user/:username', optionalAuth, getUserPosts);
router.get('/user/:username/replies', optionalAuth, getUserReplies);

// Dynamic post paths
router.get('/:id', optionalAuth, getPostDetail);
router.delete('/:id', protect, deletePost);

// Comment routes
router.get('/:id/comments', optionalAuth, getPostComments);
router.post('/:id/comments', protect, commentLimiter, createComment);

// Creation & voting
router.post('/', protect, postLimiter, createPost);
router.post('/:id/vote', protect, voteLimiter, votePost);
router.delete('/:id/vote', protect, removeVote);

module.exports = router;
