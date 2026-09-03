const express = require('express');
const router = express.Router();
const { register, login, refreshSession, logoutSession } = require('../controllers/authController');
const { sessionLimiter } = require('../middleware/rateLimiters');

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username: { type: string, example: 'batman' }
 *               email: { type: string, example: 'batman@gotham.com' }
 *               password: { type: string, example: 'secretpassword' }
 *               displayName: { type: string, example: 'Dark Knight' }
 *     responses:
 *       201:
 *         description: Account successfully registered
 *       400:
 *         description: Validation error or duplicate username/email
 */
router.post('/register', sessionLimiter, register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login an existing user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emailOrUsername, password]
 *             properties:
 *               emailOrUsername: { type: string, example: 'batman' }
 *               password: { type: string, example: 'secretpassword' }
 *     responses:
 *       200:
 *         description: Successfully logged in
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', sessionLimiter, login);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh session access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string, description: 'JWT Refresh token' }
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', refreshSession);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Logout session
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', logoutSession);

module.exports = router;
