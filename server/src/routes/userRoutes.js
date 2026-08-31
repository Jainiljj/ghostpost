const express = require('express');
const router = express.Router();
const {
  getMe,
  getUserProfile,
  updateProfile,
  changePassword,
  followUser,
  unfollowUser,
  bookmarkPost,
  unbookmarkPost,
  getBookmarks,
  updateHomeLocation,
  removeHomeLocation,
  toggleRole,
} = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/auth');

// Own profile (authenticated)
router.get('/me', protect, getMe);
router.patch('/me', protect, updateProfile);
router.patch('/me/password', protect, changePassword);
router.patch('/me/home', protect, updateHomeLocation);
router.delete('/me/home', protect, removeHomeLocation);
router.patch('/me/role', protect, toggleRole);

// Bookmarks (authenticated)
router.get('/me/bookmarks', protect, getBookmarks);
router.post('/me/bookmarks/:postId', protect, bookmarkPost);
router.delete('/me/bookmarks/:postId', protect, unbookmarkPost);

// Follow system (authenticated)
router.post('/:id/follow', protect, followUser);
router.post('/:id/unfollow', protect, unfollowUser);

// Public profile (optional auth for isFollowing flag)
router.get('/:username', optionalAuth, getUserProfile);

module.exports = router;
