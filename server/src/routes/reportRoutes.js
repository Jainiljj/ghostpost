const express = require('express');
const router = express.Router();
const { createReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { reportLimiter } = require('../middleware/rateLimiters');

/**
 * @openapi
 * /api/reports:
 *   post:
 *     summary: Flag or report a post or comment for moderation review
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetType, targetId, reason]
 *             properties:
 *               targetType: { type: string, enum: [post, comment], example: 'post' }
 *               targetId: { type: string }
 *               reason: { type: string, enum: ['Spam', 'Harassment', 'Hate Speech', 'Inappropriate Content', 'Offensive Language', 'Other'], example: 'Spam' }
 *     responses:
 *       201:
 *         description: Report filed successfully
 *       409:
 *         description: Duplicate report by same user
 */
router.post('/', protect, reportLimiter, createReport);

module.exports = router;
