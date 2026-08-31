const express = require('express');
const router = express.Router();
const { register, login, refreshSession, logoutSession } = require('../controllers/authController');
const { sessionLimiter } = require('../middleware/rateLimiters');

router.post('/register', sessionLimiter, register);
router.post('/login', sessionLimiter, login);
router.post('/refresh', refreshSession);
router.post('/logout', logoutSession);

module.exports = router;
