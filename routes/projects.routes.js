// ─────────────────────────────────────────────────────────────
// Projects Routes — full CRUD + public view
// ─────────────────────────────────────────────────────────────
const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../utils/validators');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const ctrl = require('../controllers/projects.controller');

// GET    /api/projects — Public (no auth needed for catalogue)
router.get('/', ctrl.getAll);

// GET    /api/projects/:id — Public
router.get('/:id', ctrl.getById);

// ── Protected Routes ─────────────────────────────────────────
router.use(authenticate);

// POST   /api/projects
router.post('/',
  authorize('super_admin', 'admin'),
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('client_id').isInt().withMessage('Valid client_id is required'),
    body('type').trim().notEmpty().withMessage('Project type is required'),
    body('amount').optional().isNumeric().withMessage('Amount must be a number'),
    body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be 0-100'),
    body('status').optional().isIn(['Active', 'Done', 'On Hold']).withMessage('Invalid status'),
  ],
  validate,
  ctrl.create
);

// PUT    /api/projects/:id
router.put('/:id',
  authorize('super_admin', 'admin'),
  [
    body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty'),
    body('client_id').optional().isInt().withMessage('Valid client_id is required'),
    body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Progress must be 0-100'),
    body('status').optional().isIn(['Active', 'Done', 'On Hold']).withMessage('Invalid status'),
  ],
  validate,
  ctrl.update
);

// DELETE /api/projects/:id
router.delete('/:id',
  authorize('super_admin'),
  ctrl.remove
);

module.exports = router;
