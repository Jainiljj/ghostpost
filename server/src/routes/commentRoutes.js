const express = require('express');
const router = express.Router();
const { deleteComment, voteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const { commentLimiter } = require('../middleware/rateLimiters');

router.use(protect);

/**
 * @openapi
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete a comment (Author or Admin only)
 *     tags: [Comments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Comment soft deleted or removed
 */
router.delete('/:id', deleteComment);

/**
 * @openapi
 * /api/comments/{id}/vote:
 *   post:
 *     summary: Upvote or downvote a comment
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
 *             required: [value]
 *             properties:
 *               value: { type: integer, enum: [1, -1] }
 *     responses:
 *       200:
 *         description: Updated comment score
 */
router.post('/:id/vote', commentLimiter, voteComment);

module.exports = router;
