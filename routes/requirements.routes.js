// ─────────────────────────────────────────────────────────────
// Requirements Routes — full CRUD + status workflow
// ─────────────────────────────────────────────────────────────
const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../utils/validators');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const ctrl = require('../controllers/requirements.controller');

router.use(authenticate);

// GET    /api/requirements
router.get('/', ctrl.getAll);

// POST   /api/requirements
router.post('/',
  authorize('super_admin', 'admin'),
  [
    body('client_id').isInt().withMessage('Valid client_id is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('priority').optional().isIn(['High', 'Medium', 'Low']).withMessage('Invalid priority'),
  ],
  validate,
  ctrl.create
);

// PUT    /api/requirements/:id
router.put('/:id',
  authorize('super_admin', 'admin'),
  [
    body('priority').optional().isIn(['High', 'Medium', 'Low']).withMessage('Invalid priority'),
    body('status').optional().isIn(['Pending', 'In Progress', 'Done']).withMessage('Invalid status'),
  ],
  validate,
  ctrl.update
);

// PATCH  /api/requirements/:id/advance
router.patch('/:id/advance',
  authorize('super_admin', 'admin'),
  ctrl.advanceStatus
);

// DELETE /api/requirements/:id
router.delete('/:id',
  authorize('super_admin', 'admin'),
  ctrl.remove
);

module.exports = router;
