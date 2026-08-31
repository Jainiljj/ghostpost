const express = require('express');
const router = express.Router();
const { deleteComment, voteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const { commentLimiter } = require('../middleware/rateLimiters');

router.use(protect); // All comment moderation actions require a session

router.delete('/:id', deleteComment);
router.post('/:id/vote', commentLimiter, voteComment);

module.exports = router;
