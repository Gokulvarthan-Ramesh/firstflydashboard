// ─────────────────────────────────────────────────────────────
// Auth Routes
// ─────────────────────────────────────────────────────────────
const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../utils/validators');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const ctrl = require('../controllers/auth.controller');

// POST /api/auth/register  — Super Admin only
router.post('/register',
  authenticate,
  authorize('super_admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['super_admin', 'admin', 'view_only']).withMessage('Invalid role'),
  ],
  validate,
  ctrl.register
);

// POST /api/auth/login  — Public
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  ctrl.login
);

// GET /api/auth/me  — Authenticated
router.get('/me', authenticate, ctrl.getMe);

module.exports = router;
