// ─────────────────────────────────────────────────────────────
// Overview Routes
// ─────────────────────────────────────────────────────────────
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/overview.controller');

// All overview endpoints require authentication
router.use(authenticate);

router.get('/stats',           ctrl.getStats);
router.get('/revenue-chart',   ctrl.getRevenueChart);
router.get('/project-status',  ctrl.getProjectStatus);
router.get('/recent-activity', ctrl.getRecentActivity);

module.exports = router;
