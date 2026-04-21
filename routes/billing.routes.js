// ─────────────────────────────────────────────────────────────
// Billing Routes — full CRUD + summary + mark-paid
// ─────────────────────────────────────────────────────────────
const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../utils/validators');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const ctrl = require('../controllers/billing.controller');

router.use(authenticate);

// GET    /api/billing
router.get('/', ctrl.getAll);

// GET    /api/billing/summary
router.get('/summary', ctrl.getSummary);

// GET    /api/billing/:id
router.get('/:id', ctrl.getById);

// POST   /api/billing
router.post('/',
  authorize('super_admin', 'admin'),
  [
    body('client_id').isInt().withMessage('Valid Client ID is required'),
    body('project').trim().notEmpty().withMessage('Project name is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('paid').optional().isNumeric().withMessage('Paid amount must be a number'),
  ],
  validate,
  ctrl.create
);

// PUT    /api/billing/:id
router.put('/:id',
  authorize('super_admin', 'admin'),
  [
    body('amount').optional().isNumeric(),
    body('paid').optional().isNumeric(),
    body('status').optional().isIn(['Paid', 'Partial', 'Unpaid']).withMessage('Invalid status'),
  ],
  validate,
  ctrl.update
);

// PATCH  /api/billing/:id/mark-paid
router.patch('/:id/mark-paid',
  authorize('super_admin', 'admin'),
  ctrl.markPaid
);

// DELETE /api/billing/:id
router.delete('/:id',
  authorize('super_admin'),
  ctrl.remove
);

module.exports = router;
