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

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: Retrieve currently authenticated user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *       401:
 *         description: Unauthorized
 *   patch:
 *     summary: Update profile details (displayName)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName: { type: string, example: 'Ghost Walker' }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.get('/me', protect, getMe);
router.patch('/me', protect, updateProfile);

/**
 * @openapi
 * /api/users/me/password:
 *   patch:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password updated successfully
 */
router.patch('/me/password', protect, changePassword);

/**
 * @openapi
 * /api/users/me/home:
 *   patch:
 *     summary: Set or update permanent Home location coordinates
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude: { type: number, example: 24.5854 }
 *               longitude: { type: number, example: 73.7125 }
 *     responses:
 *       200:
 *         description: Home location set
 *   delete:
 *     summary: Delete permanent Home location
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Home location removed
 */
router.patch('/me/home', protect, updateHomeLocation);
router.delete('/me/home', protect, removeHomeLocation);

/**
 * @openapi
 * /api/users/me/role:
 *   patch:
 *     summary: Toggle user role between user and admin (Development helper)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Role toggled
 */
router.patch('/me/role', protect, toggleRole);

/**
 * @openapi
 * /api/users/me/bookmarks:
 *   get:
 *     summary: Get bookmarked posts for current user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookmarked posts
 */
router.get('/me/bookmarks', protect, getBookmarks);

/**
 * @openapi
 * /api/users/me/bookmarks/{postId}:
 *   post:
 *     summary: Bookmark a post
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Post bookmarked
 *   delete:
 *     summary: Remove post bookmark
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Bookmark removed
 */
router.post('/me/bookmarks/:postId', protect, bookmarkPost);
router.delete('/me/bookmarks/:postId', protect, unbookmarkPost);

/**
 * @openapi
 * /api/users/{id}/follow:
 *   post:
 *     summary: Follow a user handle
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User followed
 */
router.post('/:id/follow', protect, followUser);

/**
 * @openapi
 * /api/users/{id}/unfollow:
 *   post:
 *     summary: Unfollow a user handle
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User unfollowed
 */
router.post('/:id/unfollow', protect, unfollowUser);

/**
 * @openapi
 * /api/users/{username}:
 *   get:
 *     summary: Fetch public user profile details
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Public profile details
 *       404:
 *         description: User not found
 */
router.get('/:username', optionalAuth, getUserProfile);

module.exports = router;
