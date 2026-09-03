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

/**
 * @openapi
 * /api/posts/global:
 *   get:
 *     summary: Fetch global post feed
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [hot, new, top], default: hot }
 *         description: Feed sorting algorithm
 *       - in: query
 *         name: cursor
 *         schema: { type: string }
 *         description: Pagination cursor string
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: tag
 *         schema: { type: string }
 *         description: Filter posts by tag
 *     responses:
 *       200:
 *         description: Global feed posts with distance labels masked
 */
router.get('/global', optionalAuth, getGlobalFeed);

/**
 * @openapi
 * /api/posts/nearby:
 *   get:
 *     summary: Fetch nearby post feed based on coordinates
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number, example: 24.5854 }
 *         description: Latitude coordinate
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number, example: 73.7125 }
 *         description: Longitude coordinate
 *       - in: query
 *         name: radius
 *         schema: { type: integer, enum: [1, 5, 10, 25], default: 10 }
 *         description: Radius in kilometers
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [hot, new, top], default: hot }
 *       - in: query
 *         name: tag
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Nearby posts with masked distance labels
 */
router.get('/nearby', optionalAuth, getNearbyFeed);

/**
 * @openapi
 * /api/posts/search:
 *   get:
 *     summary: Search posts by keyword content query
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string, example: 'Udaipur' }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [hot, new, top], default: hot }
 *     responses:
 *       200:
 *         description: Search results matching text query
 */
router.get('/search', optionalAuth, searchLimiter, searchPosts);

/**
 * @openapi
 * /api/posts/home:
 *   get:
 *     summary: Fetch home feed using user's saved home location
 *     tags: [Posts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: radius
 *         schema: { type: integer, enum: [1, 5, 10, 25], default: 10 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [hot, new, top], default: hot }
 *     responses:
 *       200:
 *         description: Posts around user's home location
 *       400:
 *         description: Home location not set
 *       401:
 *         description: Unauthorized
 */
router.get('/home', protect, getHomeFeed);

/**
 * @openapi
 * /api/posts/following:
 *   get:
 *     summary: Fetch feed of posts from followed users
 *     tags: [Posts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [hot, new, top], default: hot }
 *     responses:
 *       200:
 *         description: Feed from followed handles
 */
router.get('/following', protect, getFollowingFeed);

/**
 * @openapi
 * /api/posts/user/{username}:
 *   get:
 *     summary: Get posts authored by specific user
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User's posts
 */
router.get('/user/:username', optionalAuth, getUserPosts);

/**
 * @openapi
 * /api/posts/user/{username}/replies:
 *   get:
 *     summary: Get comment replies authored by specific user
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User's comment replies
 */
router.get('/user/:username/replies', optionalAuth, getUserReplies);

/**
 * @openapi
 * /api/posts/{id}:
 *   get:
 *     summary: Get detailed view of a single post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Post details
 *       404:
 *         description: Post not found
 *   delete:
 *     summary: Delete a post (Author or Admin only)
 *     tags: [Posts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Post deleted
 *       403:
 *         description: Forbidden
 */
router.get('/:id', optionalAuth, getPostDetail);
router.delete('/:id', protect, deletePost);

/**
 * @openapi
 * /api/posts/{id}/comments:
 *   get:
 *     summary: Get nested comment tree for a post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Nested array of root comments with recursive replies
 *   post:
 *     summary: Create a comment or reply on a post
 *     tags: [Comments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, example: 'Great post!' }
 *               parentCommentId: { type: string, description: 'Optional ID of parent comment to reply to' }
 *     responses:
 *       201:
 *         description: Comment created
 */
router.get('/:id/comments', optionalAuth, getPostComments);
router.post('/:id/comments', protect, commentLimiter, createComment);

/**
 * @openapi
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, example: 'Anyone up for chai near Lake Pichola?' }
 *               tag: { type: string, example: 'Discussion' }
 *               latitude: { type: number, example: 24.5854 }
 *               longitude: { type: number, example: 73.7125 }
 *     responses:
 *       201:
 *         description: Post created (location coordinates masked in response)
 */
router.post('/', protect, postLimiter, createPost);

/**
 * @openapi
 * /api/posts/{id}/vote:
 *   post:
 *     summary: Upvote (+1) or Downvote (-1) a post
 *     tags: [Posts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value]
 *             properties:
 *               value: { type: integer, enum: [1, -1] }
 *     responses:
 *       200:
 *         description: Updated vote score
 *   delete:
 *     summary: Remove vote from a post
 *     tags: [Posts]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Vote removed
 */
router.post('/:id/vote', protect, voteLimiter, votePost);
router.delete('/:id/vote', protect, removeVote);

module.exports = router;
