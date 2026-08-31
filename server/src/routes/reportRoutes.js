const express = require('express');
const router = express.Router();
const { createReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { reportLimiter } = require('../middleware/rateLimiters');

router.post('/', protect, reportLimiter, createReport);

module.exports = router;
