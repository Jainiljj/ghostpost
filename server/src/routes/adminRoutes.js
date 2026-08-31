const express = require('express');
const router = express.Router();
const { getAdminReports, resolveAdminReport } = require('../controllers/reportController');
const { protect, isAdmin } = require('../middleware/auth');

router.use(protect, isAdmin); // All admin routes require session AND administrator role

router.get('/reports', getAdminReports);
router.patch('/reports/:id', resolveAdminReport);

module.exports = router;
