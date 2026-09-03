const express = require('express');
const router = express.Router();
const { getAdminReports, resolveAdminReport } = require('../controllers/reportController');
const { protect, isAdmin } = require('../middleware/auth');

router.use(protect, isAdmin);

/**
 * @openapi
 * /api/admin/reports:
 *   get:
 *     summary: Fetch moderation report queue (Admin only)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, reviewed, dismissed, resolved], default: pending }
 *     responses:
 *       200:
 *         description: Reported items list
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get('/reports', getAdminReports);

/**
 * @openapi
 * /api/admin/reports/{id}:
 *   patch:
 *     summary: Resolve or dismiss moderation report (Admin only)
 *     tags: [Admin]
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
 *             required: [action]
 *             properties:
 *               action: { type: string, enum: [dismiss, remove], example: 'remove' }
 *     responses:
 *       200:
 *         description: Report status updated
 *       403:
 *         description: Forbidden - Admin role required
 */
router.patch('/reports/:id', resolveAdminReport);

module.exports = router;
